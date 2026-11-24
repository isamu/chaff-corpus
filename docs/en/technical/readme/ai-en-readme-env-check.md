# envguard

Check your `.env` file against `.env.example` before your app starts, and fail fast with a clear message when something is missing.

```
$ npx envguard
✖ Missing variables in .env:
  - STRIPE_SECRET_KEY
  - REDIS_URL

✖ Empty values:
  - SMTP_PASSWORD

Found 3 problems. Copy the missing keys from .env.example and fill them in.
```

## Why

Most of us have lost time to an app that crashes ten minutes in because someone added `REDIS_URL` to `.env.example` and nobody told you. `envguard` turns that into an error you see immediately, either when the app starts or in CI.

It has no runtime dependencies and doesn't read or print your secret values, only the variable names.

## Install

```bash
npm install --save-dev envguard
```

## Usage

### From the command line

```bash
npx envguard
```

By default it compares `.env` with `.env.example` in the current directory. Exits with code `1` if any variable from the example is missing or empty, and `0` otherwise.

Add it to your `package.json` so it runs before the dev server:

```json
{
  "scripts": {
    "predev": "envguard",
    "dev": "node server.js"
  }
}
```

### From code

```js
import { checkEnv } from "envguard";

checkEnv(); // throws if anything is missing
```

`checkEnv` reads `process.env`, so it also works when variables come from your hosting platform rather than a `.env` file.

### Options

| CLI flag | Code option | Default | Description |
| --- | --- | --- | --- |
| `--env <path>` | `envPath` | `.env` | The file to check. |
| `--example <path>` | `examplePath` | `.env.example` | The file listing the required variables. |
| `--allow-empty` | `allowEmpty` | `false` | Don't report variables that are set but empty. |
| `--extra` | `reportExtra` | `false` | Also report variables in `.env` that aren't in the example. |
| `--quiet` | `quiet` | `false` | Print nothing on success. |

### Optional variables

Mark a variable as optional in `.env.example` with a comment on the line above it:

```bash
# envguard: optional
SENTRY_DSN=
```

Optional variables are never reported as missing.

## In CI

In CI you usually don't have a `.env` file, so check the environment directly:

```bash
npx envguard --env -
```

`-` means "read from `process.env`".

## FAQ

**Does it load the `.env` file into `process.env`?**
No. Use `dotenv` or your framework's loader for that. `envguard` only checks.

**Does it validate types, like "this must be a URL"?**
No, and that's deliberate. It answers one question: is everything there? If you need schema validation, look at `envalid` or `zod`.

## License

MIT
