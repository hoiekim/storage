# Storage

Sets up a storage server that you can upload photos and videos. It'll extract metadata and store separately so it can return it via API quickly. Supports APIs for browsing files with metadata and downloading the file binary, etc.

Use the following command to setup:

```
npm install
```

Use the following command to start the server:

```
npm start
```

Use the following command for API references:

```
npm run api-docs
```

A few things to remind:

- Create [./.env](./.env) file if you want to custmize port, API key, etc. See [./.env.example](./.env.example) file for configuration options.
- Uploaded files are stored in [./files](./files) folder
- [./.temp](./.temp) folder is reserved for creating thumbnails
- Databse is stored in [./.db](./.db) file
- See [./src/server/routers](./src/server/routers) folder for references about API endpoints.

# Troubleshooting

## Install issue

If you see the following error message when trying to start the server:

```
Error: Could not load the "sharp" module using the darwin-arm64 runtime
```

Probably the dependency module `sharp` is not installed properly. Since this module includes binary executables the package manager, `npm` for example, needs to recognize your platform and choose the correct assets to install. Make sure you're using npm >= 9.6.5 with --include=optional argument when installing.

Delete installed modules.

```
rm -rf node_modules
```

Confirm you're using `npm` version >= 9.6.5.

```
npm -v
```

Re-install and start.

```
npm install --include=optional
npm start
```

See more on the [existing issue report](https://github.com/lovell/sharp/issues/3994)
