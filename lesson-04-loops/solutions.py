"""Lesson 4 solutions — with commentary.

Read these *after* you've genuinely attempted `exercises.py`.

Run me:  python3 solutions.py
"""

from exercises import _check


def count_up_to(n):
    numbers = []
    # range(1, n + 1) starts at 1 and stops *before* n + 1, i.e. ends at n.
    # The `+ 1` is the whole reason this works — it's the classic off-by-one
    # spot. If n is 0, range(1, 1) is empty and we correctly return [].
    for i in range(1, n + 1):
        numbers.append(i)
    return numbers


def sum_of(values):
    total = 0          # outside the loop
    for value in values:
        total += value  # inside the loop
    return total       # after the loop
    # An empty list means the loop body never runs, and we return the starting
    # 0 — which is exactly right. Accumulators handle "nothing" for free.


def count_vowels(text):
    count = 0
    for letter in text:
        # `in` on a string asks "is this a substring?" — for a single
        # character that's just "is it one of these five?".
        if letter in "aeiou":
            count += 1
    return count


def first_negative(values):
    for value in values:
        if value < 0:
            return value   # `return` leaves the whole function immediately,
                           # so it does the job of `break` and then some.
    return None            # only reached if the loop finished finding nothing
    # You could also write this with `break` and a variable holding the answer.
    # Returning straight out of the loop is shorter and reads better.


def countdown(start):
    result = []
    while start > 0:
        result.append(start)
        start -= 1        # THE important line: without it, `start` never
                          # reaches 0, the condition stays true, infinite loop.
    result.append("Liftoff!")
    return result
    # countdown(0) skips the loop entirely and returns just ["Liftoff!"].
    # Always ask what your loop does when there's nothing to do.


def main():
    checks = [
        _check("count_up_to(4)", count_up_to(4), [1, 2, 3, 4]),
        _check("count_up_to(1)", count_up_to(1), [1]),
        _check("count_up_to(0)", count_up_to(0), []),
        _check("sum_of([1, 2, 3])", sum_of([1, 2, 3]), 6),
        _check("sum_of([])", sum_of([]), 0),
        _check("sum_of([-5, 5, 10])", sum_of([-5, 5, 10]), 10),
        _check("count_vowels('hello')", count_vowels("hello"), 2),
        _check("count_vowels('xyz')", count_vowels("xyz"), 0),
        _check("count_vowels('aeiou')", count_vowels("aeiou"), 5),
        _check("first_negative([3, 1, -4, -9])", first_negative([3, 1, -4, -9]), -4),
        _check("first_negative([1, 2, 3])", first_negative([1, 2, 3]), None),
        _check("countdown(3)", countdown(3), [3, 2, 1, "Liftoff!"]),
        _check("countdown(0)", countdown(0), ["Liftoff!"]),
    ]
    print()
    print(f"{sum(1 for c in checks if c)} of {len(checks)} checks passing.")


if __name__ == "__main__":
    main()
