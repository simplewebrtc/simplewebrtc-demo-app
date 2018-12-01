const fs = require("fs")
const { promisify } = require("util")
const path = require("path")
const parcel = require("parcel-bundler")
const open = require("opn")
const cpx = require("cpx")

const mkdirp = promisify(require("mkdirp"))
const rimraf = promisify(require("rimraf"))
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
  const demoDir = path.join(__dirname, "..", "demos")
  const tmpDir = path.join(__dirname, "..", ".demos")

  const cleanup = () => rimraf(tmpDir)

  await cleanup()
  await copy(path.join(demoDir, "**", "*"), tmpDir, { clean: true })

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
    bundler.on("buildEnd", async () => await cleanup())
    bundler.bundle()
  } else {
    // This event is supposed to be emitted only after bundling has finished for the first
    // time but thats not the case so we use the hasOpened flag
    bundler.on(
      "bundled",
      once(() => {
        openDemos()
        cpx.watch(path.join(demoDir, "**", "*"), tmpDir, { initialCopy: false })
        process.on("SIGINT", async () => {
          await cleanup()
          process.exit(0)
        })
      })
    )

    bundler.serve(3000, true)
  }
}

startParcel().catch(e => console.error(e))
