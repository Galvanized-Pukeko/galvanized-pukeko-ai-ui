# Kitchen sink of models

We need the ability to inspect all our components (packages/client/src/components)
without a necessity to launch all the integrations.

## Criteria
- Create new `sink` command in package.json
- Create a separate application to be served with `sink`
- The new application should launch without any integrations (no webservices and other stuff)
- All components from packages/client/src/components should be listed there
- Consider if we can extract some elements or styles from App.vue and reuse them
- Make sure the app builds
- Lint