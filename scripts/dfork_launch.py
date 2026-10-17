#!/usr/bin/env python3
"""dfork_launch.py — double-fork daemon launcher (the wave-2 station lesson:
the Bash tool reaps process trees at call end; only a true double-fork that
reparents to init escapes the reaper — the agent-browser daemon pattern).

Usage:
  dfork_launch.py <logfile> <cwd> [VAR=val ...] -- <cmd> [args ...]

The grandchild ends up: PPID=1, own session+process-group, stdio redirected
to <logfile>. Nothing in the Bash call's tree references it afterwards.
"""
import os
import sys


def main() -> None:
    args = sys.argv[1:]
    if len(args) < 3:
        sys.stderr.write(__doc__)
        sys.exit(2)
    logfile = args.pop(0)
    cwd = args.pop(0)
    envs: dict[str, str] = {}
    while args and args[0] != "--" and "=" in args[0]:
        kv = args.pop(0)
        k, v = kv.split("=", 1)
        envs[k] = v
    if args and args[0] == "--":
        args.pop(0)
    cmd = args
    if not cmd:
        sys.stderr.write("dfork_launch: no command after --\n")
        sys.exit(2)

    pid = os.fork()
    if pid > 0:
        # Parent: report the intermediate pid and return immediately.
        print(f"[dfork] intermediate pid {pid} (grandchild will detach)")
        return

    # Child 1: become a new session leader (detach from the Bash tool's
    # session and process group).
    os.setsid()

    pid2 = os.fork()
    if pid2 > 0:
        # Child 1 exits — the grandchild is reparented to init (PPID=1).
        os._exit(0)

    # Child 2 (grandchild): finalize the daemon and exec the target.
    os.chdir(cwd)
    os.umask(0)
    fd = os.open(logfile, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
    os.dup2(fd, 1)
    os.dup2(fd, 2)
    devnull = os.open(os.devnull, os.O_RDONLY)
    os.dup2(devnull, 0)
    env = dict(os.environ)
    env.update(envs)
    os.execvpe(cmd[0], cmd, env)


if __name__ == "__main__":
    main()
