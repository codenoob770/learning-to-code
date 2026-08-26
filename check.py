"""Checks your work in exercises/exercises.py.

Run it with:   python3 check.py
"""

import sys
import traceback

sys.path.insert(0, "exercises")

try:
    import exercises
except Exception:
    print("Your exercises.py has an error in it. Python says:\n")
    traceback.print_exc()
    sys.exit(1)


# Each test is: (exercise name, function, arguments, expected answer)
TESTS = [
    ("1. seconds_in_an_hour", "seconds_in_an_hour", (), 3600),
    ("2. greet", "greet", ("Sam",), "Hello, Sam!"),
    ("2. greet", "greet", ("Ada",), "Hello, Ada!"),
    ("3. double_the_text_number", "double_the_text_number", ("42",), 84),
    ("3. double_the_text_number", "double_the_text_number", ("7",), 14),
    ("4. even_or_odd", "even_or_odd", (4,), "even"),
    ("4. even_or_odd", "even_or_odd", (7,), "odd"),
    ("4. even_or_odd", "even_or_odd", (0,), "even"),
    ("5. largest_of_three", "largest_of_three", (1, 2, 3), 3),
    ("5. largest_of_three", "largest_of_three", (9, 2, 3), 9),
    ("5. largest_of_three", "largest_of_three", (1, 8, 3), 8),
    ("6. add_up", "add_up", ([1, 2, 3, 4],), 10),
    ("6. add_up", "add_up", ([],), 0),
    ("7. shout_all", "shout_all", (["hi", "there"],), ["HI", "THERE"]),
    ("7. shout_all", "shout_all", ([],), []),
    ("8. count_above", "count_above", ([1, 5, 9], 4), 2),
    ("8. count_above", "count_above", ([1, 2], 10), 0),
]


def main():
    results = {}      # exercise name -> "pass" / "todo" / an error message
    order = []

    for name, func_name, args, expected in TESTS:
        if name not in results:
            order.append(name)
            results[name] = "pass"
        if results[name] != "pass":
            continue          # already failed on an earlier case

        func = getattr(exercises, func_name)
        try:
            got = func(*args)
        except Exception as exc:
            results[name] = f"crashed: {type(exc).__name__}: {exc}"
            continue

        if got is None:
            results[name] = "todo"
        elif got != expected:
            call = f"{func_name}({', '.join(repr(a) for a in args)})"
            results[name] = f"{call} gave {got!r}, expected {expected!r}"

    passed = 0
    for name in order:
        outcome = results[name]
        if outcome == "pass":
            passed += 1
            print(f"  PASS  {name}")
        elif outcome == "todo":
            print(f"  TODO  {name} — not started yet")
        else:
            print(f"  FAIL  {name} — {outcome}")

    total = len(order)
    print(f"\n{passed} of {total} exercises passing.")
    if passed == total:
        print("All done. Nice work — tell Claude and we'll move on to the next set.")
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
