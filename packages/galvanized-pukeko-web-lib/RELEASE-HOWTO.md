# Release HOWTO

## Creating npm version

Before releasing, review changes with Gaunt Sloth:
```bash
git --no-pager diff v0.0.1..HEAD | gth review
```

Ensure `npm config set git-tag-version true` is configured.

**Important:** The `files` block in package.json strictly controls what gets released; it overrides `.npmignore`.

**For patch releases** (e.g., 0.0.1 to 0.0.2):
```bash
cd packages/galvanized-pukeko-web-lib
npm version patch -m "Release notes"
git push --follow-tags
```

**For minor releases** (e.g., 0.0.1 to 0.1.0):
```bash
cd packages/galvanized-pukeko-web-lib
npm version minor -m "Release notes"
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
cd packages/galvanized-pukeko-web-lib
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
git difftool v0.0.1 HEAD -d
```

**Using vimdiff:**
```bash
git config --global diff.tool vimdiff
git difftool v0.0.1 HEAD
```

## Cleaning up the mess

Delete accidental tags:
```bash
git tag -d v0.0.2
git push --delete origin v0.0.2
```

Delete accidental npm versions:
```bash
npm unpublish @galvanized-pukeko/vue-ui@0.0.2
```

**Warning:** npm unpublish is only allowed within 72 hours of publication and may not be available for all versions.
