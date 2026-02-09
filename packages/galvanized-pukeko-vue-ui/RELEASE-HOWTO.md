# Release HOWTO

## Creating npm version

Before releasing, review changes with Gaunt Sloth:
```bash
git --no-pager diff @galvanized-pukeko/vue-ui@0.0.1..HEAD -- packages/galvanized-pukeko-vue-ui | gth review
```

**Important:** The `files` block in package.json strictly controls what gets released; it overrides `.npmignore`.

### Prerequisites (monorepo)

`npm version` requires a clean working tree. In a monorepo, other packages may have pending changes. **Commit all changes from the repo root before versioning:**

```bash
git add -A && git commit -m "pre-release housekeeping"
```

### Tagging convention

Tags use the full scoped package name: `@galvanized-pukeko/vue-ui@<version>`

Configure npm to use this format:
```bash
cd packages/galvanized-pukeko-vue-ui
npm config set --location project tag-version-prefix "@galvanized-pukeko/vue-ui@"
```

**For patch releases** (e.g., 0.0.1 to 0.0.2):
```bash
cd packages/galvanized-pukeko-vue-ui
npm version patch -m "@galvanized-pukeko/vue-ui@%s"
git push --follow-tags
```

**For minor releases** (e.g., 0.0.1 to 0.1.0):
```bash
cd packages/galvanized-pukeko-vue-ui
npm version minor -m "@galvanized-pukeko/vue-ui@%s"
git push --follow-tags
```

Type `\` then Enter to create new lines in commit messages.

## Publish Release to GitHub

Note the release version from the previous step, then run:
```bash
gh release create --notes-from-tag
```

Or use alternatives:
```bash
gh release create --notes-file pathToFile
gh release create --notes "notes"
```

(Use `gh auth switch` if managing multiple accounts)

## Publish to NPM

Before publishing, ensure you're logged in and have the correct permissions:

```bash
npm login
```

Build the library before publishing:
```bash
cd packages/galvanized-pukeko-vue-ui
npm run build
```

Then publish the package:
```bash
npm publish --access public
```

**Note:** The `--access public` flag is required for scoped packages (@galvanized-pukeko/vue-ui) to make them publicly available.

Review the file list before confirming publication. The package will be published as `@galvanized-pukeko/vue-ui`.

## Viewing diff side by side

**Using KDE Kompare:**
```bash
git config --global diff.tool kompare
git difftool @galvanized-pukeko/vue-ui@0.0.1 HEAD -d
```

**Using vimdiff:**
```bash
git config --global diff.tool vimdiff
git difftool @galvanized-pukeko/vue-ui@0.0.1 HEAD
```

## Cleaning up the mess

Delete accidental tags:
```bash
git tag -d @galvanized-pukeko/vue-ui@0.0.2
git push --delete origin @galvanized-pukeko/vue-ui@0.0.2
```

Delete accidental npm versions:
```bash
npm unpublish @galvanized-pukeko/vue-ui@0.0.2
```

**Warning:** npm unpublish is only allowed within 72 hours of publication and may not be available for all versions.
