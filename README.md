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
- Uploaded files are stored in [./public](./public) folder
- [./.temp](./.temp) folder is reserved for creating thumbnails
- Databse is stored in [./.db](./.db) file
- See [./src/server/routers](./src/server/routers) folder for references about API endpoints.
