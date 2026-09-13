# Working on BC250-Toolkit

Notes for anyone — human or agent — touching this repository. Everything here
was learned from a bug that shipped, and none of it is guessable from the code.

This plugin shares its updater, its notification helper and its release workflow
with Steamcord, SkullKey and BC250-Toolkit. **A fix in one belongs in all four** —
check the siblings the same day, comparing `git log <last tag>..HEAD` rather than
trusting a clean working tree.


## Ground rule

**No commit, no push, no tag, no release without the maintainer's explicit go.**
Working in the tree is expected; publishing is not.

## Deploying and reloading

```bash
sudo bc250-toolkit-deploy  # passwordless, reloads backend AND frontend
```

Close and reopen the Quick Access Menu afterwards.

This plugin declares `flags: ["root"]`, so its backend runs as root and can
always write into its own directory — which is why it never hit the permission
failures the others did.

⛔ **Never restart the gamescope session** (`gamescope-session-plus@*.service`)
to reload a plugin. It kills the running game and drops the user out of their
voice call.

⚠️ The installed layout is **flat**: `decky plugin build` promotes the *contents*
of `defaults/` to the plugin root. There is no `defaults/` directory in a real
install, so no code path may depend on one.

## What Decky lets a plugin write

Measured on a real install:

```
plugin top-level directory   root:root       → creating an entry: DENIED
plugin.json                  root:root       → writing: DENIED
everything else inside       user-owned      → overwriting: OK
subdirectories               user-owned      → creating inside: OK
```

`updater.py` therefore surveys the release **before** writing anything: a code
file it cannot write cancels the update untouched, while docs, licences and
`plugin.json` are skipped and the update proceeds. Do not turn that back into a
write-as-you-go loop — a half-applied update leaves the plugin part old code,
part new, which is worse than no update.

The release check also retries while the failure is the network: it runs a few
seconds after boot, which is often **before** DNS is up. Three boots out of four
were dying on `Temporary failure in name resolution` with nothing retrying.

⛔ **Do not delegate installs to `DeckyBackend.call('utilities/install_plugin')`.**
That is the Decky *Store* route: after unpacking it reports the install to
`plugins.deckbrew.xyz`, which does not know a self-distributed plugin, and the
request 404s. The flow then stops — files written, plugin never reloaded, and a
confirmation dialog frozen over the Steam UI — and it leaves the whole plugin
directory root-owned.

## Notifications

Use the local `notify()` helper (`SteamClient.ClientNotifications`), never
`toaster.toast`. The Decky toaster creates entries without `notification_type`
which do not appear and can crash the Steam notification panel on this build. A
`steamid` is mandatory; without one the entry is malformed.

## Testing backend code without Decky

`main.py` cannot be imported directly. Parse it and execute only the functions
under test:

```python
tree = ast.parse(open("main.py").read())
picked = [n for n in tree.body if getattr(n, "name", None) in WANTED]
exec(compile(ast.Module(body=picked, type_ignores=[]), "main.py", "exec"), ns)
```

A stub `decky` module on `sys.path` is needed, and for plugins that keep code in
`defaults/`, that directory too.
