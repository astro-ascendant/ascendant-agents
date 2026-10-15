.DEFAULT_GOAL := help
.PHONY: help build publish

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

build: ## Install deps, match versions, rebuild everything and verify
	bun install --frozen-lockfile
	(cd .opencode && bun install --frozen-lockfile)
	node scripts/sync-versions.mjs
	npm run typecheck && bun test && npm run lint && npm run format:check

version: ## Consume changesets into version bumps + changelogs, then restamp
	npx changeset version
	node scripts/sync-versions.mjs

publish: ## Version from changesets, rebuild all and publish opencode-ascendant
	npx changeset version
	node scripts/sync-versions.mjs
	cd packages/opencode-ascendant && bun install && npm publish --provenance --access public
