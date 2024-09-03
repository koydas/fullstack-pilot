import process from 'process'
import { execSync } from 'child_process'
import chalk from 'chalk'
import fs from 'fs'

const app_name = process.argv.slice(2)[0]

if (!app_name) {
    console.error(chalk.red("error: need to pass app name"))
    process.exit()
}

console.log(chalk.yellow(`--- creating ${app_name} application (nextjs) ---`))

const exists = fs.existsSync(app_name)

if (!exists) {
    fs.mkdirSync(app_name)
}

execSync(`cd ${app_name} && npx create-next-app@latest`)