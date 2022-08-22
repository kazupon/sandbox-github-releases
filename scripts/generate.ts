import { exec } from 'node:child_process'
import { existCommand } from './utils'
import semver from 'semver'

function gitTags(): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const child = await exec(`git --no-pager tag`)
      child.stdout!.on('data', data => resolve(data.toString().trim()))
    } catch (e) {
      reject(e)
    }
  })
}

function parseTags(tags: string) {
  return tags.split(`\n`).filter(Boolean).filter(tag => semver.valid(tag))
}


type GitHubRelease = {
  name: string
  tagName: string
  url: string
  publishedAt: string
  body: string
}

function fetchGithubRelease(tag: string): Promise<GitHubRelease> {
  return new Promise(async (resolve, reject) => {
    try {
      const child = await exec(`gh release view ${tag} --json tagName,name,url,publishedAt,body`, { env: { ...process.env } })
      if (child.stdout) {
        child.stdout.on('data', data => {
          resolve(JSON.parse(data) as GitHubRelease)
        })
      } else {
	reject(new Error('stdout is null'))
      }
    } catch (e) {
      reject(e)
    }
  })
}

function buildChangelog(release: GitHubRelease): string {
  return `# ${release.name}${release.name !== release.tagName ? ` ${release.tagName}` : ''} (${release.publishedAt})

This changelog is generated by [GitHub Releases](${release.url})

${release.body}

`
}

async function main() {
  // check command
  for (const command of ['git', 'gh']) {
    if (!await existCommand(command)) {
      throw new Error(`'${command}' has not found`)
    }
  }

  const tags = parseTags( await gitTags()).sort(semver.compare).reverse()
  const contents: string[] = []
  for (const tag of tags) {
    const release = await fetchGithubRelease(tag)
    contents.push(buildChangelog(release))
  }
  console.log(contents.join(`\r\n`))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
