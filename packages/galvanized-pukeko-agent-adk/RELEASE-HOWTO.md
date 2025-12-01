# Release Howto

## Prerequisites

- GPG with a published key
- `.m2/settings.xml` with Sonatype credentials:
```xml
<server>
  <id>central</id>
  <username>TOKEN-NAME</username>
  <password>TOKEN-CODE</password>
</server>
```

## Local Development

For local testing without GPG signing or javadoc generation:
```bash
./mvnw clean install
```

## Release to Maven Central

Activate the `release` profile to enable GPG signing, source jars, and javadocs:
```bash
./mvnw clean deploy -Prelease
```