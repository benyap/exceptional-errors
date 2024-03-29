module.exports = {
  github: {
    release: true,
    releaseName: "v${version}",
  },
  npm: {
    publish: false,
  },
  git: {
    tag: true,
    tagName: "${version}",
    commit: true,
    commitMessage: "chore(release): release ${version}",
  },
  hooks: {
    "after:bump": ["pnpm build"],
  },
  plugins: {
    "@release-it/conventional-changelog": {
      infile: "CHANGELOG.md",
      preset: {
        name: "conventionalcommits",
        types: [
          { type: "feat", section: "Features" },
          { type: "fix", section: "Bug Fixes" },
          { type: "deps", section: "Dependencies" },
          { type: "docs", section: "Documentation" },
          { type: "chore", section: "Internal" },
          { type: "tooling", section: "Internal" },
          { type: "revert", section: "Reverts" },
        ],
      },
    },
  },
};
