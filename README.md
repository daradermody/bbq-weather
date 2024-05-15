# bbq-weather

## Setup

Copy `.env.json.empty` to `.env.json` and fill in with the appropriate information

If using a Gmail account as your emailer, you can create an app-specific password by following [these instructions](https://support.google.com/accounts/answer/185833?hl=en).

## Usage

If your `.env.json` file is set up, you can trigger the program with:
```bash
yarn start
```

Here's an example of a cron entry that triggers the program every day at 11am:
```cron
00 11 * * * cd ~/git/bbq-weather/ && yarn start
```
