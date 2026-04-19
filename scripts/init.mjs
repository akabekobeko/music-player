import { createInterface } from 'node:readline/promises'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Prompt the user for input with a default value.
 * Returns the default if the user enters an empty string.
 * @param {import('node:readline/promises').Interface} rl
 * @param {string} message - The prompt message.
 * @param {string} defaultValue - The default value shown in brackets.
 * @returns {Promise<string>} The user's input or the default value.
 */
async function prompt(rl, message, defaultValue) {
  const answer = await rl.question(`${message} [${defaultValue}]: `)
  return answer.trim() || defaultValue
}

/**
 * Interactively initialize the project with custom app name, ID, and license.
 * Updates package.json, electron-builder.yml, and LICENSE.
 */
async function initElectronProject() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const root = path.join(__dirname, '..')
  const rl = createInterface({ input: process.stdin, output: process.stdout })

  try {
    console.log('Initialize your Electron app.\n')

    // Gather user input
    const packageName = await prompt(rl, 'Package name', 'my-electron-app')
    const productName = await prompt(rl, 'Product name (displayed to users)', 'MyElectronApp')
    const description = await prompt(rl, 'Description', '')
    const appId = await prompt(rl, 'App ID (reverse domain)', `com.example.${packageName}`)
    const author = await prompt(rl, 'Author (for LICENSE copyright)', '')

    // Show summary
    console.log('\n--- Summary ---')
    console.log(`  Package name : ${packageName}`)
    console.log(`  Product name : ${productName}`)
    console.log(`  Description  : ${description || '(empty)'}`)
    console.log(`  App ID       : ${appId}`)
    console.log(`  Author       : ${author || '(empty)'}`)
    console.log('----------------\n')

    const confirm = await rl.question('Apply these changes? (y/N): ')
    if (confirm.trim().toLowerCase() !== 'y') {
      console.log('Aborted.')
      process.exit(0)
    }

    // 1. Update package.json
    const pkgPath = path.join(root, 'package.json')
    const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'))
    pkg.name = packageName
    pkg.description = description
    if (author) {
      pkg.author = author
    }
    await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
    console.log('Updated package.json')

    // 2. Update electron-builder.yml
    const builderPath = path.join(root, 'electron-builder.yml')
    let builderYml = await readFile(builderPath, 'utf-8')
    builderYml = builderYml.replace(/^appId:.+$/m, `appId: ${appId}`)
    builderYml = builderYml.replace(/^productName:.+$/m, `productName: ${productName}`)
    await writeFile(builderPath, builderYml)
    console.log('Updated electron-builder.yml')

    // 3. Update LICENSE copyright line
    if (author) {
      const licensePath = path.join(root, 'LICENSE')
      let license = await readFile(licensePath, 'utf-8')
      const year = new Date().getFullYear()
      license = license.replace(
        /^Copyright \(c\) .+$/m,
        `Copyright (c) ${year} ${author}`
      )
      await writeFile(licensePath, license)
      console.log('Updated LICENSE')
    }

    console.log('\nDone!')
  } finally {
    rl.close()
  }
}

initElectronProject()
