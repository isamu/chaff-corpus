# standup-bot

A small Slack bot that collects async standup updates. At a set time each weekday it sends everyone on the team a direct message with three questions, then posts the answers together in the team channel.

We wrote it for our own team of six because we didn't want another paid tool for something this simple. It runs on a single small server, keeps its state in SQLite, and has no web dashboard.

## How it works

1. At the configured time (default 9:30, in each person's own Slack time zone), the bot DMs each team member:
   - What did you finish yesterday?
   - What are you working on today?
   - Is anything blocking you?
2. People answer in the DM, one message per question.
3. At the posting time (default 11:00, team time zone), the bot posts one thread in the team channel with everyone's answers. People who haven't answered are listed at the end.

People on leave can type `/standup skip` to be left out for the day, or `/standup away 5` to be left out for the next five working days.

## Requirements

- Python 3.11+
- A Slack workspace where you can install apps
- Somewhere to run a long-lived process (we use a small VM; a Raspberry Pi works too)

## Setup

### 1. Create the Slack app

Go to https://api.slack.com/apps, click **Create New App**, choose **From an app manifest**, and paste in the contents of `slack-manifest.yml` from this repo. This sets up the scopes and the `/standup` command.

Install the app to your workspace and copy two values:

- **Bot User OAuth Token** (starts with `xoxb-`), under OAuth & Permissions
- **App-Level Token** (starts with `xapp-`), under Basic Information. Give it the `connections:write` scope.

The bot uses Socket Mode, so you don't need a public URL.

### 2. Install and configure

```bash
git clone https://github.com/example/standup-bot.git
cd standup-bot
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp config.example.toml config.toml
```

Edit `config.toml`:

```toml
channel = "#team-standup"
members = ["U01ABCDEF", "U02GHIJKL"]   # Slack user IDs
ask_at = "09:30"
post_at = "11:00"
team_timezone = "Europe/London"
skip_days = ["Sat", "Sun"]
```

To find someone's user ID, open their profile in Slack, click the three dots, and choose **Copy member ID**.

Set the tokens as environment variables:

```bash
export SLACK_BOT_TOKEN=xoxb-...
export SLACK_APP_TOKEN=xapp-...
```

### 3. Run it

```bash
python -m standup_bot
```

Invite the bot to the channel (`/invite @standup-bot`) or it won't be able to post there.

For a permanent install there's a systemd unit file in `deploy/standup-bot.service`.

## Commands

| Command | What it does |
| --- | --- |
| `/standup skip` | Skip today's standup |
| `/standup away N` | Skip the next N working days |
| `/standup back` | Cancel an `away` |
| `/standup now` | Send yourself the questions now, e.g. if you dismissed the DM |

## Known limitations

- One team per instance. If you need two teams, run two copies with different config files.
- Answers are matched to questions by order, so if someone sends their answer to question 1 in two messages, the second message gets taken as the answer to question 2. We've lived with this; a fix is welcome.
- Public holidays aren't handled. Add them to `skip_dates` in the config by hand.

## License

MIT
