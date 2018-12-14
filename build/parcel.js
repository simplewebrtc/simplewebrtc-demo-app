const fs = require("fs")
const { promisify } = require("util")
const path = require("path")
const parcel = require("parcel-bundler")
const open = require("opn")
const cpx = require("cpx")
const rimraf = require("rimraf")

const mkdirp = promisify(require("mkdirp"))
const readdir = promisify(fs.readdir)
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)
const stat = promisify(fs.stat)
const copy = promisify(cpx.copy)

const [CLI_COMMAND, ...CLI_DEMOS] = process.argv.slice(2)

const registerOnExit = runOnExit => {
  const exitHandler = ({ cleanup = false } = {}) =>
    cleanup === true ? runOnExit() : process.exit()

  //do something when app is closing
  process.on("exit", () => exitHandler({ cleanup: true }))
  //catches ctrl+c event
  process.on("SIGINT", () => exitHandler())
  // catches "kill pid" (for example: nodemon restart)
  process.on("SIGUSR1", () => exitHandler())
  process.on("SIGUSR2", () => exitHandler())
  //catches uncaught exceptions
  process.on("uncaughtException", () => exitHandler())
}

const listDemos = async p => {
  for (const demo of CLI_DEMOS) {
    // Throw an error if any picked CLI demos dont exist
    try {
      await stat(path.join(p, demo))
    } catch (e) {
      if (e.code === "ENOENT") {
        throw new Error(`The provided demo directory ${demo} does not exist`)
      }
      throw e
    }
  }

  const result = []
  const demoDirs = (await readdir(p)).filter(
    d => (CLI_DEMOS.length ? CLI_DEMOS.includes(d) : true)
  )

  for (const demo of demoDirs) {
    const demoPath = path.join(p, demo)
    const demoStats = await stat(demoPath)
    if (demoStats.isDirectory()) {
      result.push({ name: demo, path: demoPath })
    }
  }

  return result
}

const openDemos = async port => {
  const demos = await listDemos("./demos")

  const openOptions = {
    // https://github.com/sindresorhus/opn#app
    // Demo testing works better in Chrome
    app: ["google chrome"]
  }

  if (demos.length === 1) {
    open(`https://localhost:${port}/index.html`, openOptions)
  } else {
    for (const demo of demos) {
      await open(`https://localhost:${port}/${demo.name}/index.html`, {
        ...openOptions,
        // Set wait to true to have the demos open one at a time
        // The only caveat is that the application must be *quit completely*
        // for the next demo to open
        wait: false
      })
    }
  }
}

const writeHtml = async (dir, hasCss) =>
  writeFile(
    path.join(dir, "index.html"),
    (await readFile(path.join(__dirname, "index.html")))
      .toString()
      .replace(
        /(<\/head>)/,
        `${hasCss ? "<link rel='stylesheet' href='./main.css'>" : ""}$1`
      )
      .replace(/\{\{title\}\}/g, path.basename(dir)),
    "utf-8"
  )

const writeApp = async dir =>
  writeFile(
    path.join(dir, "app.js"),
    (await readFile(path.join(__dirname, "app.js"))).toString(),
    "utf-8"
  )

const startParcel = async () => {
  const demoGlob = path.join(__dirname, "..", "demos", "**", "*")
  const tmpDir = path.join(__dirname, "..", ".demos")

  // Sync so it works with process exit handelrs
  const cleanup = () => rimraf.sync(tmpDir)

  cleanup()

  // Copy everything from demo to a temporary directory
  // Allows the demos to be simpler and only export the main component but still
  // share all the client code from build/ like the index.html and HMR
  await copy(demoGlob, tmpDir, { clean: true })

  // Then write the main app file and index.html to each temporary demo
  for (const demo of await listDemos(tmpDir)) {
    const hasCss = fs.existsSync(path.join(demo.path, "main.css"))
    await writeHtml(demo.path, hasCss)
    await writeApp(demo.path)
  }

  const bundler = new parcel(path.join(tmpDir, "**", "index.html"), {
    hmr: true,
    https: true
  })

  if (CLI_COMMAND === "build") {
    bundler.on("buildEnd", cleanup)
    bundler.bundle()
  } else {
    const server = await bundler.serve(3000, true)
    openDemos(server.address().port)
    // Setup a watcher to automatically copy changes from the real demo to the temporary demo
    cpx.watch(demoGlob, tmpDir, { initialCopy: false })
    registerOnExit(cleanup)
  }
}

startParcel().catch(e => console.error(e))
