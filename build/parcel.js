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

const BUILD = process.argv.slice(2).includes("build")

const once = fn => {
  let hasRun = false
  return () => {
    if (hasRun) return
    hasRun = true
    fn()
  }
}

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

const openDemos = async () => {
  const demos = (await readdir("./demos")).filter(i => i !== "config.js")

  for (const demo of demos) {
    await open(`https://localhost:3000/${demo}/index.html`, {
      // https://github.com/sindresorhus/opn#app
      app: ["google chrome"],
      // Set wait to true to have the demos open one at a time
      // The only caveat is that the application must be *quit completely*
      // for the next demo to open
      wait: false
    })
  }
}

const writeHtml = async dir =>
  writeFile(
    path.join(dir, "index.html"),
    (await readFile(path.join(__dirname, "index.html"))).toString(),
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
  for (const demo of await readdir(tmpDir)) {
    const demoPath = path.join(tmpDir, demo)
    const demoStats = await stat(demoPath)
    if (demoStats.isDirectory()) {
      await writeHtml(demoPath)
      await writeApp(demoPath)
    }
  }

  const bundler = new parcel(path.join(tmpDir, "**", "index.html"), {
    hmr: true,
    https: true
  })

  if (BUILD) {
    bundler.on("buildEnd", cleanup)
    bundler.bundle()
  } else {
    // This event is supposed to be emitted only after bundling has finished for the first
    // time but thats not the case so we use "once"
    bundler.on(
      "bundled",
      once(() => {
        openDemos()
        // Setup a watcher to automatically copy changes from the real demo to the temporary demo
        cpx.watch(demoGlob, tmpDir, { initialCopy: false })
        registerOnExit(cleanup)
      })
    )

    bundler.serve(3000, true)
  }
}

startParcel().catch(e => console.error(e))
