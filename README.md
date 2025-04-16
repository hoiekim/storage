# Storage

Sets up a storage server that you can upload photos and videos. It'll extract metadata and store separately so it can return it via API quickly. Supports APIs for browsing files with metadata and downloading the file binary, etc.

# How to setup

Use the following command to setup:

```
npm install
```

Use the following command to start the server:

```
npm start
```

A few things to remind:

- Create [./.env](./.env) file if you want to customize port. See [./.env.example](./.env.example) file for configuration options.
- Uploaded files and database are stored in [./data](./data) folder
- See [./src/server/routers](./src/server/routers) folder for more references about API endpoints.

Now the server should be running on `localhost:3006`.

> When the server first runs you'll get the admin user credentials(API key). Save this key to make API calls as admin user. For example:
>
> ```
> Successfully created user
> -> username: admin
> -> api_key: b5858ad0-76c0-4e4f-9e6a-7c9d807ab7d2
> ```

# How to create user & API key

We use one API key for one user. Use the following command to create a user and generate an API key for the user:

```
npm run create-user -- --username my-user
```

Save the generated API key shown in the log for example,

```
Successfully created user
-> username: my-user
-> api_key: b5858ad0-76c0-4e4f-9e6a-7c9d807ab7d2
```

Include the API key in the request to access API endpoints.

```
curl -H "authorization: Bearer b5858ad0-76c0-4e4f-9e6a-7c9d807ab7d2" localhost:3006
```

or

```
curl "localhost:3006?api_key=b5858ad0-76c0-4e4f-9e6a-7c9d807ab7d2"
```

# API references

Use the following command for API references:

```
npm run api-docs
```

# How to access from the internet

If you followed the above setup steps your storage server must be accessible via `localhost:3006` but this address is accessible only within the same device. To access your server from the internet you need to figure out the public IP address of the device that you're running the server.

## Devices on cloud computing services (AWS, etc.)

I'm skipping this section because you might be already familiar with the concept of public IP address if you're using any cloud computing services. If you still need help ask your cloud computing service provider for the instructions.

## Devices on home devices (laptop, desktop, etc.)

You can use websites like [whatismyipaddress.com](https://whatismyipaddress.com) to figure out your public IP address. Verify connection using this command:

```
curl http://{your-ip-address}:3006
```

It's great if that works, however, most people might still have trouble if they're using wifi router. Consider reading your router provider's guide to setup NAT forwarding to locate specific device([example reference](https://www.tp-link.com/us/user-guides/archer-a7&c7_v5/chapter-13-nat-forwarding)) and DDNS to setup fixed domain for dynamic IP([example reference](https://www.tp-link.com/us/user-guides/archer-a7&c7_v5/chapter-15-customize-your-network-settings#ug-sub-title-4)).

It's still not likely that you can access your server from the internet if your internet service provider assigned you an IP under CGNAT(Carrier-grade NAT). You know that you're under CGNAT when the IP address that your router recognizes doesn't match the public IP address you found in [whatismyipaddress.com](https://whatismyipaddress.com). Also IP addresses under CGNAT often looks like 100.x.x.x. In this case, you need to ask your internet service provider to have you opt-out from CGNAT and assign you a public IP address.

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

## Video thumbnail issue

If your storage server can't create video thumbnails and prints out errors such as:

```
bash: command not found: ffmpeg
```

Install `ffmpeg` and make sure it's available via CLI. See more in [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg/tree/v2.1.3?tab=readme-ov-file#prerequisites).
