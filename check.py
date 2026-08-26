"""Checks your practice files.

Run it by typing:   python3 check.py
"""

import subprocess
import sys

# Each one is: file number, what it's about, what it should print.
PRACTICE = [
    ("01", "print a word", ["Hello"]),
    ("02", "do some maths", ["42"]),
    ("03", "boxes", ["15"]),
    ("04", "choices", ["hot"]),
    ("05", "loops", ["cat", "dog", "fox"]),
    ("06", "all together", ["3"]),
]


def run_file(path):
    return subprocess.run(
        [sys.executable, path],
        capture_output=True,
        text=True,
        timeout=15,
        stdin=subprocess.DEVNULL,
    )


def main():
    done = 0

    for number, title, should_print in PRACTICE:
        path = f"practice/{number}.py"
        label = f"{number}  ({title})"

        try:
            result = run_file(path)
        except FileNotFoundError:
            print(f"  MISSING   {label} - can't find {path}")
            continue
        except subprocess.TimeoutExpired:
            print(f"  STUCK     {label} - it never finished. A loop may be going forever.")
            continue

        if result.returncode != 0:
            complaint = [line for line in result.stderr.strip().splitlines() if line.strip()]
            print(f"  BROKEN    {label}")
            if complaint:
                print(f"            the computer said: {complaint[-1]}")
            continue

        printed = [line for line in result.stdout.strip().splitlines() if line.strip()]

        if not printed:
            print(f"  NOT DONE  {label} - it doesn't print anything yet")
        elif printed == should_print:
            done += 1
            print(f"  DONE      {label}")
        else:
            print(f"  NOT YET   {label}")
            print(f"            it printed:      {' / '.join(printed)}")
            print(f"            it should print: {' / '.join(should_print)}")

    print()
    print(f"{done} out of {len(PRACTICE)} done.")
    if done == len(PRACTICE):
        print("All of them. Nicely done - tell Claude and we'll do the next bit.")

    return 0 if done == len(PRACTICE) else 1


if __name__ == "__main__":
    sys.exit(main())
