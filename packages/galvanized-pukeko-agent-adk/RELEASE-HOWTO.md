# Release Howto

Needs GPG with a published key to be present.

Needs .m2/settings.xml to be present, codes to be acquired from sonatype.
```xml
<server>
  <id>central</id>
  <username>TOKEN-NAME</username>
  <password>TOKEN-CODE</password>
</server>
```

```bash
./mvnw deploy
```