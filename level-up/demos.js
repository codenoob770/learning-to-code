/* =============================================================
   demos.js: animated stick figures that show each move
   -------------------------------------------------------------
   Each demo is a list of POSES. A pose says where the figure's
   joints are: head (h), neck (n), hips (p), elbows (e), wrists (w),
   knees (k) and feet (f). "1" is the arm or leg nearest to you,
   "2" the one further away (drawn a bit fainter). An optional "s"
   bends the back (for cat-cow and child's pose).

   The drawing area is 120 wide and 80 tall, and the floor is at
   y = 74. Bigger y means LOWER on the screen.

   The animation slides smoothly from one pose to the next, holds
   for a moment, and loops.

   1. Helpers for building poses
   2. All the demos
   3. Which demo goes with which exercise
   4. Drawing and animating
   5. The "Show me" pop-up
   ============================================================= */


/* 1. HELPERS FOR BUILDING POSES ----------------------------------- */

// Standing, seen from the side, facing right. "lift" raises it off the floor.
function standingPose(x = 60, lift = 0) {
  return {
    h: [x, 16 - lift], n: [x, 24 - lift], p: [x, 46 - lift],
    e1: [x + 1, 35 - lift], w1: [x + 2, 45 - lift], e2: [x - 1, 35 - lift], w2: [x - 2, 45 - lift],
    k1: [x + 1, 60 - lift], f1: [x + 2, 74 - lift], k2: [x - 1, 60 - lift], f2: [x - 2, 74 - lift],
  };
}

// Standing, seen from the front
function frontPose(x = 60, lift = 0) {
  return {
    h: [x, 16 - lift], n: [x, 24 - lift], p: [x, 46 - lift],
    e1: [x - 5, 34 - lift], w1: [x - 7, 44 - lift], e2: [x + 5, 34 - lift], w2: [x + 7, 44 - lift],
    k1: [x - 3, 60 - lift], f1: [x - 4, 74 - lift], k2: [x + 3, 60 - lift], f2: [x + 4, 74 - lift],
  };
}

// A copy of a pose with some joints moved
function change(pose, changes) {
  return { ...pose, ...changes };
}

// A copy of a pose slid sideways (dx) and up or down (dy)
function slide(pose, dx, dy) {
  const moved = {};
  for (const [joint, [x, y]] of Object.entries(pose)) moved[joint] = [x + dx, y + dy];
  return moved;
}

// A copy flipped left-to-right (for moves that go side to side)
function flip(pose) {
  const flipped = {};
  for (const [joint, [x, y]] of Object.entries(pose)) flipped[joint] = [120 - x, y];
  return flipped;
}

// Swap the near and far arms and legs (for moves that alternate)
function swapSides(pose) {
  return change(pose, { e1: pose.e2, w1: pose.w2, e2: pose.e1, w2: pose.w1, k1: pose.k2, f1: pose.f2, k2: pose.k1, f2: pose.f1 });
}


/* 2. ALL THE DEMOS ----------------------------------------------------
   props: things to draw, like a chair, a wall or a ball.
   hold: how long to pause on each pose, in milliseconds.            */

const STAND = standingPose();

const PLANK_UP = {
  h: [94, 48], n: [86, 52], p: [51, 63],
  e1: [86, 63], w1: [86, 74], e2: [84, 63], w2: [84, 74],
  k1: [33, 68.5], f1: [16, 74], k2: [33, 68.5], f2: [16, 74],
};

const PUSHUP_DOWN = {
  h: [95, 61], n: [86, 65], p: [51, 69.5],
  e1: [79, 66], w1: [86, 74], e2: [77, 66], w2: [84, 74],
  k1: [33, 72], f1: [16, 74], k2: [33, 72], f2: [16, 74],
};

const SQUAT = {
  h: [63, 29], n: [58, 36], p: [47, 55],
  e1: [69, 37], w1: [80, 36], e2: [68, 38], w2: [79, 37],
  k1: [63, 57], f1: [62, 74], k2: [62, 57], f2: [61, 74],
};

const CROUCH = {
  h: [72, 44], n: [66, 48], p: [50, 58],
  e1: [70, 61], w1: [72, 74], e2: [68, 61], w2: [70, 74],
  k1: [64, 58], f1: [60, 74], k2: [63, 58], f2: [59, 74],
};

const ARMS_UP_JUMP = change(standingPose(60, 7), { e1: [62, 6], w1: [64, -3], e2: [58, 6], w2: [56, -3] });

const ON_BACK = {
  h: [20, 68], n: [28, 70], p: [54, 71],
  e1: [40, 73], w1: [50, 73], e2: [39, 73], w2: [49, 73],
};

const FACE_DOWN = {
  h: [92, 69], n: [84, 71], p: [54, 72],
  e1: [96, 72], w1: [106, 72], e2: [95, 72], w2: [105, 72],
  k1: [36, 72], f1: [18, 72], k2: [36, 72], f2: [18, 72],
};

const RUN = {
  h: [67, 17], n: [64, 25], p: [58, 46],
  e1: [56, 32], w1: [54, 41], e2: [70, 31], w2: [76, 25],
  k1: [70, 56], f1: [76, 70], k2: [50, 58], f2: [42, 66],
};

const STANCE = {
  h: [60, 16], n: [60, 24], p: [58, 46],
  e1: [66, 30], w1: [70, 22], e2: [62, 32], w2: [68, 27],
  k1: [66, 60], f1: [70, 74], k2: [52, 60], f2: [46, 74],
};
// In these, leg "1" (the bright one) is the kicking leg
const CHAMBER = change(STANCE, { k2: [57, 60], f2: [56, 74], k1: [70, 40], f1: [62, 52] });
const FRONT_KICK = change(CHAMBER, { k1: [75, 40], f1: [91, 37] });
const ROUNDHOUSE = change(CHAMBER, { n: [58, 25], h: [56, 17], k1: [73, 37], f1: [91, 30] });

const ALL_FOURS = {
  n: [84, 54], p: [52, 54],
  e1: [84, 64], w1: [84, 74], e2: [82, 64], w2: [82, 74],
  k1: [52, 74], f1: [36, 74], k2: [50, 74], f2: [34, 74],
};

const SHUFFLE_LOW = {
  h: [50, 24], n: [50, 32], p: [50, 52],
  e1: [44, 40], w1: [46, 48], e2: [56, 40], w2: [54, 48],
  k1: [42, 62], f1: [38, 74], k2: [58, 62], f2: [62, 74],
};

const SKATE = {
  h: [44, 22], n: [46, 29], p: [48, 50],
  e1: [38, 36], w1: [32, 44], e2: [56, 34], w2: [60, 42],
  k1: [46, 62], f1: [46, 74], k2: [56, 62], f2: [64, 70],
};

const SIDE_LUNGE = {
  h: [50, 26], n: [50, 34], p: [52, 54],
  e1: [46, 42], w1: [51, 46], e2: [55, 42], w2: [52, 46],
  k1: [40, 62], f1: [34, 74], k2: [68, 64], f2: [84, 74],
};

const STREAMLINE = change(standingPose(), { h: [60, 20], n: [60, 26], e1: [60, 13], w1: [60, 3], e2: [60, 13], w2: [60, 3] });

const DEMOS = {
  // --- Upper body ---
  pushup: { frames: [PLANK_UP, PUSHUP_DOWN] },
  inclinePushup: {
    props: ["bench"],
    frames: [
      { h: [94, 41], n: [86, 46], p: [51, 60], e1: [87, 52], w1: [88, 58], e2: [85, 52], w2: [86, 58], k1: [33, 67], f1: [16, 74], k2: [33, 67], f2: [16, 74] },
      { h: [95, 49], n: [86, 53], p: [51, 64], e1: [79, 49], w1: [88, 58], e2: [77, 49], w2: [86, 58], k1: [33, 69], f1: [16, 74], k2: [33, 69], f2: [16, 74] },
    ],
  },
  dips: {
    props: ["chair"],
    frames: [
      { h: [53, 28], n: [50, 36], p: [52, 58], e1: [46, 43], w1: [44, 50], e2: [45, 43], w2: [42, 50], k1: [70, 57], f1: [72, 74], k2: [69, 57], f2: [71, 74] },
      { h: [53, 38], n: [50, 46], p: [52, 67], e1: [41, 42], w1: [44, 50], e2: [40, 42], w2: [42, 50], k1: [70, 62], f1: [72, 74], k2: [69, 62], f2: [71, 74] },
    ],
  },
  shoulderTaps: { frames: [change(PLANK_UP, { e1: [80, 60], w1: [85, 54] }), PLANK_UP, change(PLANK_UP, { e2: [79, 60], w2: [84, 55] }), PLANK_UP] },
  superman: { frames: [FACE_DOWN, change(FACE_DOWN, { h: [94, 62], n: [84, 66], e1: [96, 62], w1: [108, 58], e2: [95, 62], w2: [107, 58], k1: [36, 70], f1: [18, 66], k2: [36, 70], f2: [18, 66] })], hold: 700 },
  inchworm: {
    frames: [
      standingPose(40),
      { h: [54, 70], n: [50, 63], p: [40, 44], e1: [53, 68], w1: [56, 74], e2: [52, 68], w2: [55, 74], k1: [40, 59], f1: [40, 74], k2: [40, 59], f2: [40, 74] },
      { h: [113, 52], n: [106, 56], p: [73, 65], e1: [106, 65], w1: [106, 74], e2: [104, 65], w2: [104, 74], k1: [56, 69.5], f1: [40, 74], k2: [56, 69.5], f2: [40, 74] },
      { h: [54, 70], n: [50, 63], p: [40, 44], e1: [53, 68], w1: [56, 74], e2: [52, 68], w2: [55, 74], k1: [40, 59], f1: [40, 74], k2: [40, 59], f2: [40, 74] },
    ],
  },

  // --- Legs ---
  squat: { frames: [STAND, SQUAT] },
  jumpSquat: { frames: [SQUAT, ARMS_UP_JUMP], hold: 150 },
  lunge: {
    frames: [STAND, { h: [58, 24], n: [58, 32], p: [58, 54], e1: [58, 43], w1: [60, 53], e2: [58, 43], w2: [56, 53], k1: [72, 56], f1: [74, 74], k2: [52, 70], f2: [38, 72] }],
  },
  splitSquat: {
    props: ["lowChair"],
    frames: [
      { h: [59, 16], n: [59, 24], p: [58, 46], e1: [59, 35], w1: [60, 45], e2: [58, 35], w2: [57, 45], k1: [64, 60], f1: [68, 74], k2: [46, 52], f2: [32, 56] },
      { h: [57, 26], n: [57, 34], p: [56, 56], e1: [57, 45], w1: [58, 55], e2: [56, 45], w2: [55, 55], k1: [70, 58], f1: [71, 74], k2: [44, 66], f2: [32, 56] },
    ],
  },
  wallSit: {
    props: ["wall"],
    frames: [
      { h: [44, 22], n: [43, 30], p: [45, 52], e1: [50, 40], w1: [58, 48], e2: [49, 41], w2: [57, 49], k1: [63, 52], f1: [63, 74], k2: [62, 52], f2: [62, 74] },
      { h: [44, 23], n: [43, 31], p: [45, 52], e1: [50, 41], w1: [58, 49], e2: [49, 42], w2: [57, 50], k1: [63, 52], f1: [63, 74], k2: [62, 52], f2: [62, 74] },
    ],
    hold: 900,
  },
  bridge: {
    frames: [
      change(ON_BACK, { h: [18, 69], n: [27, 71], p: [50, 71], k1: [66, 57], f1: [76, 74], k2: [65, 57], f2: [75, 74] }),
      change(ON_BACK, { h: [18, 69], n: [27, 71], p: [50, 58], k1: [66, 52], f1: [76, 74], k2: [65, 52], f2: [75, 74] }),
    ],
  },
  calfRaise: { props: ["step"], frames: [STAND, change(standingPose(60, 4), { f1: [62, 74], f2: [58, 74] })] },

  // --- Core ---
  curlup: {
    frames: [
      change(ON_BACK, { h: [22, 68], n: [30, 70], p: [56, 71], e1: [42, 73], w1: [54, 73], e2: [41, 73], w2: [53, 73], k1: [70, 56], f1: [80, 74], k2: [69, 56], f2: [79, 74] }),
      change(ON_BACK, { h: [34, 55], n: [40, 61], p: [56, 71], e1: [50, 68], w1: [62, 73], e2: [49, 68], w2: [61, 73], k1: [70, 56], f1: [80, 74], k2: [69, 56], f2: [79, 74] }),
    ],
  },
  plank: {
    frames: [
      { h: [93, 53], n: [84, 57], p: [51, 64.5], e1: [84, 74], w1: [97, 74], e2: [82, 74], w2: [95, 74], k1: [33, 69], f1: [16, 74], k2: [33, 69], f2: [16, 74] },
      { h: [93, 53], n: [84, 57], p: [51, 63.5], e1: [84, 74], w1: [97, 74], e2: [82, 74], w2: [95, 74], k1: [33, 68.5], f1: [16, 74], k2: [33, 68.5], f2: [16, 74] },
    ],
    hold: 900,
  },
  bicycle: {
    frames: [
      { h: [26, 58], n: [34, 63], p: [58, 71], e1: [38, 54], w1: [28, 56], e2: [37, 54], w2: [27, 56], k1: [52, 52], f1: [66, 52], k2: [78, 66], f2: [96, 63] },
      { h: [28, 57], n: [35, 62], p: [58, 71], e1: [39, 53], w1: [29, 55], e2: [38, 53], w2: [28, 55], k1: [78, 66], f1: [96, 63], k2: [52, 52], f2: [66, 52] },
    ],
  },
  deadBug: {
    frames: [
      { h: [20, 68], n: [28, 70], p: [54, 71], e1: [30, 59], w1: [32, 47], e2: [29, 59], w2: [31, 47], k1: [55, 57], f1: [68, 57], k2: [54, 57], f2: [67, 57] },
      { h: [20, 68], n: [28, 70], p: [54, 71], e1: [18, 64], w1: [8, 70], e2: [29, 59], w2: [31, 47], k1: [55, 57], f1: [68, 57], k2: [68, 66], f2: [84, 70] },
    ],
  },
  sidePlank: {
    frames: [
      { h: [84, 44], n: [78, 49], p: [49, 63], e1: [78, 74], w1: [90, 74], e2: [80, 38], w2: [82, 26], k1: [34, 68.5], f1: [18, 73], k2: [34, 67], f2: [18, 71] },
      { h: [84, 44], n: [78, 49], p: [49, 60], e1: [78, 74], w1: [90, 74], e2: [80, 38], w2: [82, 26], k1: [34, 67], f1: [18, 73], k2: [34, 65.5], f2: [18, 71] },
    ],
    hold: 900,
  },

  // --- Speed and cardio ---
  jacks: {
    frames: [
      frontPose(),
      { h: [60, 16], n: [60, 24], p: [60, 46], e1: [52, 16], w1: [46, 7], e2: [68, 16], w2: [74, 7], k1: [52, 60], f1: [46, 74], k2: [68, 60], f2: [74, 74] },
    ],
    hold: 80,
  },
  highKnees: {
    frames: [
      { h: [60, 16], n: [60, 24], p: [60, 46], e1: [54, 33], w1: [56, 41], e2: [66, 32], w2: [68, 24], k1: [73, 46], f1: [72, 60], k2: [60, 60], f2: [60, 74] },
      { h: [60, 16], n: [60, 24], p: [60, 46], e1: [66, 32], w1: [68, 24], e2: [54, 33], w2: [56, 41], k1: [60, 60], f1: [60, 74], k2: [73, 46], f2: [72, 60] },
    ],
    hold: 40,
    speed: 2,
  },
  skaters: { frames: [SKATE, flip(SKATE)], hold: 120 },
  mountainClimbers: {
    frames: [change(PLANK_UP, { k1: [68, 60], f1: [60, 70] }), change(PLANK_UP, { k2: [68, 60], f2: [60, 70] })],
    hold: 40,
    speed: 2,
  },
  burpee: { frames: [STAND, CROUCH, PLANK_UP, CROUCH, ARMS_UP_JUMP], hold: 120 },
  lineHops: {
    props: ["line"],
    frames: [slide(frontPose(), -10, 0), frontPose(60, 6), slide(frontPose(), 10, 0), frontPose(60, 6)],
    hold: 60,
    speed: 2,
  },

  // --- Running and play ---
  run: { frames: [RUN, swapSides(RUN)], hold: 20, speed: 2 },
  jog: {
    frames: [
      { h: [60, 16], n: [60, 24], p: [60, 46], e1: [55, 33], w1: [58, 40], e2: [65, 33], w2: [68, 27], k1: [67, 52], f1: [65, 66], k2: [60, 60], f2: [60, 74] },
      { h: [60, 16], n: [60, 24], p: [60, 46], e1: [65, 33], w1: [68, 27], e2: [55, 33], w2: [58, 40], k1: [60, 60], f1: [60, 74], k2: [67, 52], f2: [65, 66] },
    ],
    hold: 20,
    speed: 2,
  },
  walk: {
    frames: [
      { h: [61, 16], n: [60, 24], p: [60, 46], e1: [57, 35], w1: [55, 44], e2: [63, 35], w2: [66, 43], k1: [64, 60], f1: [68, 74], k2: [56, 60], f2: [52, 74] },
      { h: [61, 16], n: [60, 24], p: [60, 46], e1: [63, 35], w1: [66, 43], e2: [57, 35], w2: [55, 44], k1: [56, 60], f1: [52, 74], k2: [64, 60], f2: [68, 74] },
    ],
    hold: 60,
  },

  // --- Taekwondo ---
  stanceBounce: { frames: [STANCE, slide(STANCE, 0, 2)], hold: 30, speed: 2 },
  chamberHold: { frames: [STANCE, CHAMBER], hold: 900 },
  slowKicks: { frames: [STANCE, CHAMBER, FRONT_KICK, CHAMBER], hold: 500 },
  kickCombo: { frames: [STANCE, CHAMBER, FRONT_KICK, CHAMBER, ROUNDHOUSE, CHAMBER], hold: 150 },

  // --- Swimming (dry-land) ---
  ytw: { frames: [FACE_DOWN, change(FACE_DOWN, { h: [93, 65], n: [84, 68], e1: [95, 63], w1: [106, 60], e2: [94, 63], w2: [105, 60] })], hold: 700 },
  streamlineHold: { frames: [STREAMLINE, change(slide(STREAMLINE, 0, -3), { f1: [62, 74], f2: [58, 74] })], hold: 900 },
  streamlineJumps: {
    frames: [change(SQUAT, { e1: [60, 26], w1: [61, 16], e2: [59, 26], w2: [60, 16], h: [62, 30] }), slide(STREAMLINE, 0, -8)],
    hold: 150,
  },
  flutterKicks: {
    frames: [
      change(ON_BACK, { k1: [72, 67], f1: [92, 62], k2: [72, 69], f2: [92, 70] }),
      change(ON_BACK, { k1: [72, 69], f1: [92, 70], k2: [72, 67], f2: [92, 62] }),
    ],
    hold: 20,
    speed: 2,
  },

  // --- Soccer ---
  balanceReach: {
    frames: [
      change(STAND, { e1: [68, 30], w1: [76, 28], e2: [52, 30], w2: [44, 28], k1: [68, 59], f1: [81, 66] }),
      change(STAND, { e1: [68, 30], w1: [76, 28], e2: [52, 30], w2: [44, 28], k1: [54, 59], f1: [42, 64] }),
    ],
    hold: 400,
  },
  lateralShuffle: {
    frames: [SHUFFLE_LOW, change(slide(SHUFFLE_LOW, 10, 0), { k1: [56, 62], f1: [54, 74], k2: [64, 62], f2: [66, 74] }), slide(SHUFFLE_LOW, 20, 0), change(slide(SHUFFLE_LOW, 10, 0), { k1: [56, 62], f1: [54, 74], k2: [64, 62], f2: [66, 74] })],
    hold: 40,
  },
  toeTaps: {
    props: ["ball"],
    frames: [
      change(STAND, { k1: [68, 54], f1: [71, 62] }),
      change(STAND, { k2: [67, 54], f2: [70, 62] }),
    ],
    hold: 40,
    speed: 2,
  },

  // --- Stretches and warm-ups ---
  catCow: {
    frames: [
      change(ALL_FOURS, { s: [68, 44], h: [92, 62] }),
      change(ALL_FOURS, { s: [68, 60], h: [94, 46] }),
    ],
    hold: 600,
  },
  childsPose: {
    frames: [
      { h: [76, 70], n: [68, 67], s: [52, 60], p: [38, 65], e1: [82, 71], w1: [97, 74], e2: [81, 71], w2: [96, 74], k1: [52, 74], f1: [28, 74], k2: [51, 74], f2: [27, 74] },
      { h: [76, 70], n: [68, 67], s: [52, 58], p: [38, 64], e1: [82, 71], w1: [97, 74], e2: [81, 71], w2: [96, 74], k1: [52, 74], f1: [28, 74], k2: [51, 74], f2: [27, 74] },
    ],
    hold: 1200,
  },
  hamstringStretch: {
    frames: [
      { h: [62, 50], n: [56, 56], p: [38, 72], e1: [64, 64], w1: [76, 69], e2: [63, 64], w2: [75, 69], k1: [58, 72], f1: [78, 71], k2: [48, 62], f2: [44, 72] },
      { h: [66, 54], n: [59, 59], p: [38, 72], e1: [67, 66], w1: [79, 70], e2: [66, 66], w2: [78, 70], k1: [58, 72], f1: [78, 71], k2: [48, 62], f2: [44, 72] },
    ],
    hold: 1000,
  },
  quadStretch: {
    frames: [
      change(STAND, { k1: [60, 60], f1: [50, 50], e1: [56, 38], w1: [51, 49], e2: [66, 30], w2: [74, 26] }),
      change(STAND, { k1: [60, 60], f1: [49, 48], e1: [55, 38], w1: [50, 47], e2: [66, 30], w2: [74, 26] }),
    ],
    hold: 1000,
  },
  figure4: {
    frames: [
      change(ON_BACK, { h: [18, 69], n: [26, 71], p: [50, 71], e1: [40, 60], w1: [58, 58], e2: [39, 61], w2: [57, 59], k2: [62, 54], f2: [74, 62], k1: [56, 46], f1: [63, 55] }),
      change(ON_BACK, { h: [18, 69], n: [26, 71], p: [50, 71], e1: [40, 58], w1: [56, 56], e2: [39, 59], w2: [55, 57], k2: [60, 52], f2: [72, 59], k1: [54, 44], f1: [61, 53] }),
    ],
    hold: 1000,
  },
  butterfly: {
    frames: [
      { h: [60, 36], n: [60, 44], p: [60, 66], e1: [53, 56], w1: [56, 68], e2: [67, 56], w2: [64, 68], k1: [44, 62], f1: [57, 71], k2: [76, 62], f2: [63, 71] },
      { h: [60, 36], n: [60, 44], p: [60, 66], e1: [53, 56], w1: [56, 68], e2: [67, 56], w2: [64, 68], k1: [43, 67], f1: [57, 71], k2: [77, 67], f2: [63, 71] },
    ],
    hold: 700,
  },
  sideLunge: { frames: [SIDE_LUNGE, flip(SIDE_LUNGE)], hold: 900 },
  armCircles: {
    frames: [
      change(frontPose(), { e1: [50, 25], w1: [40, 25], e2: [70, 25], w2: [80, 25] }),
      change(frontPose(), { e1: [52, 17], w1: [45, 10], e2: [68, 17], w2: [75, 10] }),
      change(frontPose(), { e1: [50, 25], w1: [40, 25], e2: [70, 25], w2: [80, 25] }),
      change(frontPose(), { e1: [52, 32], w1: [44, 38], e2: [68, 32], w2: [76, 38] }),
    ],
    hold: 0,
  },
  legSwings: {
    props: ["wall"],
    frames: [
      change(STAND, { e2: [52, 30], w2: [41, 30], k1: [70, 57], f1: [81, 65] }),
      change(STAND, { e2: [52, 30], w2: [41, 30], k1: [54, 58], f1: [45, 68] }),
    ],
    hold: 60,
  },
  hipCircles: {
    frames: [change(frontPose(), { p: [56, 46], e1: [56, 34], w1: [57, 44], e2: [64, 34], w2: [63, 44] }), change(frontPose(), { p: [64, 46], e1: [56, 34], w1: [57, 44], e2: [64, 34], w2: [63, 44] })],
    hold: 100,
  },
};


/* 3. WHICH DEMO GOES WITH WHICH EXERCISE ------------------------------
   Keyed by the exercise's id in plan.js. A few depend on which
   version you're doing, like incline push-ups or jump squats.        */

const DEMO_FOR = {
  pushup: (name) => (name.includes("Incline") ? "inclinePushup" : "pushup"),
  dips: "dips", shoulderTaps: "shoulderTaps", superman: "superman", inchworm: "inchworm",
  squat: (name) => (name.includes("Jump") ? "jumpSquat" : "squat"),
  lunge: (name) => (name.includes("Split") ? "splitSquat" : "lunge"),
  wallSit: "wallSit", bridge: "bridge", calfRaise: "calfRaise",
  curlup: "curlup", plank: "plank", bicycle: "bicycle", deadBug: "deadBug", sidePlank: "sidePlank",
  jacks: "jacks", highKnees: "highKnees", skaters: "skaters", mountainClimbers: "mountainClimbers",
  burpee: "burpee", lineHops: "lineHops",
  play: "run", sprints: "run", quickFeet: "jog",
  ytw: "ytw", streamlineHold: "streamlineHold", flutterKicks: "flutterKicks", streamlineJumps: "streamlineJumps",
  balanceReach: "balanceReach", lateralShuffle: "lateralShuffle", toeTaps: "toeTaps", sprintTurn: "run",
  chamberHold: "chamberHold", slowKicks: "slowKicks", stanceBounce: "stanceBounce", kickCombo: "kickCombo",
  catCow: "catCow", childsPose: "childsPose", hamstring: "hamstringStretch", quad: "quadStretch",
  figure4: "figure4", butterfly: "butterfly", sideLunge: "sideLunge", walk: "walk",
};

// The demo for a move (from plan.js), or null if there isn't one
function demoKeyFor(move) {
  if (move.demo) return move.demo; // warm-up and cool-down items name their demo
  const found = DEMO_FOR[move.id];
  if (!found) return null;
  return typeof found === "function" ? found(move.name) : found;
}


/* 4. DRAWING AND ANIMATING -------------------------------------------- */

const SVG_NS = "http://www.w3.org/2000/svg";

function svgElement(tag, attributes) {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  return element;
}

// The furniture and things some moves use
function drawProps(svg, props = []) {
  const group = svgElement("g", { class: "demo__props" });
  for (const prop of props) {
    if (prop === "chair") {
      group.append(svgElement("path", { d: "M22 26 V74 M22 50 H46 M46 50 V74" }));
    } else if (prop === "lowChair") {
      group.append(svgElement("path", { d: "M14 56 H36 M16 56 V74 M34 56 V74" }));
    } else if (prop === "bench") {
      group.append(svgElement("path", { d: "M80 58 H106 M82 58 V74 M104 58 V74" }));
    } else if (prop === "wall") {
      group.append(svgElement("path", { d: "M37 4 V74" }));
    } else if (prop === "step") {
      group.append(svgElement("path", { d: "M44 74 V70 H76 V74" }));
    } else if (prop === "ball") {
      group.append(svgElement("circle", { cx: 74, cy: 68, r: 6 }));
    } else if (prop === "line") {
      group.append(svgElement("path", { d: "M60 70 V76", class: "demo__tape" }));
    }
  }
  svg.append(group);
}

// Builds a demo picture. The animator moves its joints later.
function createDemo(key, label) {
  const demo = DEMOS[key];
  const svg = svgElement("svg", { class: "demo", viewBox: "0 -6 120 86", role: "img", "aria-label": label || "How to do this move" });
  svg.append(svgElement("line", { class: "demo__ground", x1: 4, y1: 74.5, x2: 116, y2: 74.5 }));
  drawProps(svg, demo.props);
  const parts = {
    farArm: svgElement("polyline", { class: "demo__limb demo__limb--far" }),
    farLeg: svgElement("polyline", { class: "demo__limb demo__limb--far" }),
    torso: svgElement("path", { class: "demo__limb" }),
    head: svgElement("circle", { class: "demo__head", r: 5 }),
    nearLeg: svgElement("polyline", { class: "demo__limb" }),
    nearArm: svgElement("polyline", { class: "demo__limb" }),
  };
  svg.append(parts.farArm, parts.farLeg, parts.torso, parts.head, parts.nearLeg, parts.nearArm);
  svg.demoKey = key;
  svg.demoParts = parts;
  drawPose(svg, demo.frames[0]);
  startDemoAnimation();
  return svg;
}

function drawPose(svg, pose) {
  const parts = svg.demoParts;
  const pt = (joint) => `${pose[joint][0].toFixed(1)},${pose[joint][1].toFixed(1)}`;
  parts.farArm.setAttribute("points", `${pt("n")} ${pt("e2")} ${pt("w2")}`);
  parts.nearArm.setAttribute("points", `${pt("n")} ${pt("e1")} ${pt("w1")}`);
  parts.farLeg.setAttribute("points", `${pt("p")} ${pt("k2")} ${pt("f2")}`);
  parts.nearLeg.setAttribute("points", `${pt("p")} ${pt("k1")} ${pt("f1")}`);
  // The back: a straight line, or a curve when the pose has a "s" point
  parts.torso.setAttribute("d", pose.s ? `M${pt("n")} Q${pt("s")} ${pt("p")}` : `M${pt("n")} L${pt("p")}`);
  parts.head.setAttribute("cx", pose.h[0].toFixed(1));
  parts.head.setAttribute("cy", pose.h[1].toFixed(1));
}

// Blend two poses: amount 0 = the first, 1 = the second
function blendPoses(a, b, amount) {
  const blended = {};
  const spineA = a.s || [(a.n[0] + a.p[0]) / 2, (a.n[1] + a.p[1]) / 2];
  const spineB = b.s || [(b.n[0] + b.p[0]) / 2, (b.n[1] + b.p[1]) / 2];
  for (const joint of Object.keys(a)) {
    if (joint === "s" || !b[joint]) continue;
    blended[joint] = [a[joint][0] + (b[joint][0] - a[joint][0]) * amount, a[joint][1] + (b[joint][1] - a[joint][1]) * amount];
  }
  if (a.s || b.s) blended.s = [spineA[0] + (spineB[0] - spineA[0]) * amount, spineA[1] + (spineB[1] - spineA[1]) * amount];
  return blended;
}

// Smooth start and stop, instead of moving at one steady speed
function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

let demoAnimating = false;

// One loop animates every demo on the page
function startDemoAnimation() {
  if (demoAnimating || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  demoAnimating = true;
  function frame(now) {
    const demos = document.querySelectorAll("svg.demo");
    if (demos.length === 0) {
      demoAnimating = false;
      return;
    }
    for (const svg of demos) {
      const demo = DEMOS[svg.demoKey];
      if (!demo || demo.frames.length < 2 || svg.classList.contains("demo--still")) continue;
      const move = 700 / (demo.speed || 1);
      const hold = demo.hold ?? 300;
      const step = move + hold;
      const time = now % (step * demo.frames.length);
      const index = Math.floor(time / step);
      const into = time - index * step;
      const amount = into < hold ? 0 : easeInOut((into - hold) / move);
      drawPose(svg, blendPoses(demo.frames[index], demo.frames[(index + 1) % demo.frames.length], amount));
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Tiny still pictures inside the "Show me" buttons
function fillDemoIcons(container) {
  container.querySelectorAll("[data-demo-icon]").forEach((spot) => {
    const svg = createDemo(spot.dataset.demoIcon, "");
    svg.classList.add("demo--still");
    svg.setAttribute("aria-hidden", "true");
    spot.replaceWith(svg);
  });
}


/* 5. THE "SHOW ME" POP-UP -------------------------------------------- */

const demoBox = document.querySelector("#demo-box");

function openDemo(key, name, how) {
  const spot = document.querySelector("#demo-picture");
  spot.replaceChildren(createDemo(key, `Animation showing how to do ${name}`));
  document.querySelector("#demo-title").textContent = name;
  document.querySelector("#demo-how").textContent = how;
  demoBox.hidden = false;
  document.querySelector("#demo-close").focus();
}

function closeDemo() {
  demoBox.hidden = true;
  document.querySelector("#demo-picture").replaceChildren();
}

document.querySelector("#demo-close").addEventListener("click", closeDemo);
demoBox.addEventListener("click", (event) => {
  if (event.target === demoBox) closeDemo(); // tapped outside the card
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !demoBox.hidden) closeDemo();
});
