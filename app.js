(() => {
  const canvas = document.getElementById("game");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const screen = document.getElementById("screen");
  const levelText = document.getElementById("levelText");
  const statA = document.getElementById("statA");
  const statB = document.getElementById("statB");
  const tipEl = document.getElementById("tip");
  const demoToggle = document.getElementById("demoToggle");
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  const soundToggle = document.getElementById("soundToggle");

  const W = canvas.width;
  const H = canvas.height;

  const palette = {
    sky: "#0c1d14",
    sky2: "#123524",
    grass: "#1f7a4a",
    grass2: "#2ea866",
    mint: "#6bffb7",
    yellow: "#ffe66b",
    orange: "#ffb86b",
    red: "#ff6b6b",
    wall: "#55635e",
    wall2: "#48524e",
    wall3: "#66726d",
    road: "#2d3631",
    drum2: "#a27d4f",
    roof: "#5f6b66",
    roof2: "#4e5954",
    roofEdge: "#7a8682",
    roofRidge: "#e7c167",
    wood: "#b4463a",
    wood2: "#d96b55",
    woodShadow: "#8f3430",
    brick: "#7d8481",
    brickDark: "#6b726f",
    brickLight: "#8f9592",
    leaf: "#43cf74",
    tree: "#2f8a4f",
    path: "#d9c7a1",
    bench: "#8b5a3c",
    benchLeg: "#5d3b28",
    person: "#e8d2b4",
    flower: "#ff7aa2",
    flower2: "#ffd1df"
  };

  const rand = (min, max) => Math.random() * (max - min) + min;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function resize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = Math.min(vw / W, vh / H);
    screen.style.width = `${Math.floor(W * scale)}px`;
    screen.style.height = `${Math.floor(H * scale)}px`;
  }

  window.addEventListener("resize", resize);
  resize();

  function toGameCoords(clientX, clientY) {
    const rect = screen.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const y = ((clientY - rect.top) / rect.height) * H;
    return { x, y };
  }

  function pix(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  const FONT = {
    A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
    D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
    E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
    M: ["10001", "11011", "10101", "10001", "10001", "10001", "10001"],
    O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
    R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
    U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
    W: ["10001", "10001", "10001", "10001", "10101", "11011", "10001"],
    " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"]
  };

  function measurePixelText(text, scale = 1, spacing = 1) {
    return (text.length * 5 + (text.length - 1) * spacing) * scale;
  }

  function drawPixelText(text, x, y, color, scale = 1, spacing = 1) {
    const upper = text.toUpperCase();
    let cursorX = Math.round(x);
    const cursorY = Math.round(y);
    for (const char of upper) {
      const glyph = FONT[char] || FONT[" "];
      for (let row = 0; row < glyph.length; row++) {
        const line = glyph[row];
        for (let col = 0; col < line.length; col++) {
          if (line[col] === "1") {
            pix(cursorX + col * scale, cursorY + row * scale, scale, scale, color);
          }
        }
      }
      cursorX += (5 + spacing) * scale;
    }
  }

  function drawTree(x, y, scale, sway, amp = 0.5) {
    const trunkH = 8 * scale;
    const trunkW = 3 * scale;
    pix(x, y - trunkH, trunkW, trunkH, palette.drum2);
    const leafW = 10 * scale;
    const leafH = 8 * scale;
    const swayX = Math.sin(sway) * amp * scale;
    pix(x - 4 * scale + swayX, y - trunkH - leafH + 1, leafW, leafH, palette.leaf);
    pix(x - 3 * scale + swayX, y - trunkH - leafH - 2, leafW - 2, leafH - 2, palette.tree);
  }

  function drawDrumTower(x, y) {
    const baseW = 78;
    const baseH = 30;
    const baseX = Math.round(x);
    const baseY = Math.round(y);
    pix(baseX, baseY, baseW, baseH, palette.brick);
    pix(baseX, baseY + baseH - 6, baseW, 6, palette.brickDark);

    const dashY1 = baseY + 6;
    const dashY2 = baseY + 14;
    for (let dx = baseX + 4; dx <= baseX + baseW - 8; dx += 10) {
      pix(dx, dashY1, 4, 2, palette.brickLight);
    }
    for (let dx = baseX + 7; dx <= baseX + baseW - 9; dx += 11) {
      pix(dx, dashY2, 3, 2, palette.brickLight);
    }

    const archW = 14;
    const archH = 12;
    const archGap = 10;
    const arches = [
      baseX + 8,
      baseX + 8 + archW + archGap,
      baseX + 8 + (archW + archGap) * 2
    ];
    for (const ax of arches) {
      pix(ax, baseY + baseH - archH, archW, archH, "#2c2f2d");
      pix(ax + 2, baseY + baseH - archH - 2, archW - 4, 2, "#2c2f2d");
    }

    const bodyW = 56;
    const bodyH = 22;
    const bodyX = baseX + Math.floor((baseW - bodyW) / 2);
    const bodyY = baseY - bodyH + 2;
    pix(bodyX, bodyY, bodyW, bodyH, palette.wood);
    pix(bodyX, bodyY + bodyH - 4, bodyW, 4, palette.woodShadow);
    for (let i = 0; i < 4; i++) {
      pix(bodyX + 6 + i * 12, bodyY + 4, 3, bodyH - 8, palette.wood2);
      pix(bodyX + 9 + i * 12, bodyY + 6, 6, 6, "#2d1f1b");
    }

    const roof1W = bodyW + 12;
    const roof1H = 6;
    const roof1X = bodyX - 6;
    const roof1Y = bodyY - 6;
    pix(roof1X, roof1Y, roof1W, roof1H, palette.roof);
    pix(roof1X, roof1Y + roof1H - 2, roof1W, 2, palette.roofEdge);
    pix(roof1X - 2, roof1Y + roof1H - 2, 4, 2, palette.roofEdge);
    pix(roof1X + roof1W - 2, roof1Y + roof1H - 2, 4, 2, palette.roofEdge);

    const roof2W = bodyW - 2;
    const roof2H = 5;
    const roof2X = bodyX + 1;
    const roof2Y = bodyY - 12;
    pix(roof2X, roof2Y, roof2W, roof2H, palette.roof2);
    pix(roof2X, roof2Y + roof2H - 2, roof2W, 2, palette.roofEdge);
    pix(roof2X - 2, roof2Y + roof2H - 2, 4, 2, palette.roofEdge);
    pix(roof2X + roof2W - 2, roof2Y + roof2H - 2, 4, 2, palette.roofEdge);
    pix(roof2X + 4, roof2Y - 2, roof2W - 8, 2, palette.roofRidge);
    pix(roof2X + roof2W / 2 - 3, roof2Y - 5, 6, 3, palette.roofRidge);

    return { x: baseX, w: baseW, topY: roof2Y - 6 };
  }

  function drawPerson(x, y, shirt) {
    pix(x, y - 4, 2, 2, palette.person);
    pix(x - 1, y - 2, 4, 2, shirt);
    pix(x - 1, y, 1, 2, "#1a1a1a");
    pix(x + 2, y, 1, 2, "#1a1a1a");
  }

  function drawBench(x, y) {
    pix(x, y, 10, 2, palette.bench);
    pix(x, y + 2, 10, 1, palette.benchLeg);
    pix(x + 1, y + 3, 1, 3, palette.benchLeg);
    pix(x + 8, y + 3, 1, 3, palette.benchLeg);
  }

  function drawPocketPark(park, time) {
    pix(park.x, park.y, park.w, park.h, "#4b5250");
    if (park.t <= 0) return;
    ctx.globalAlpha = park.t;
    pix(park.x + 1, park.y + 1, park.w - 2, park.h - 2, palette.grass2);
    pix(park.x + 3, park.y + Math.floor(park.h / 2) - 1, park.w - 6, 3, palette.path);
    pix(park.x + 2, park.y + park.h - 6, park.w - 4, 2, "#c7b08a");
    pix(park.x + 2, park.y + 3, park.w - 4, 1, "#3a7d53");
    drawBench(park.x + 3, park.y + 4);
    drawTree(park.x + park.w - 10, park.y + park.h - 2, 0.7, time + 1, 0.5);
    drawTree(park.x + 10, park.y + park.h - 2, 0.6, time + 2, 0.5);
    drawPerson(park.x + 14, park.y + park.h - 5, "#4aa3ff");
    drawPerson(park.x + 20, park.y + park.h - 7, "#ff7aa2");
    ctx.globalAlpha = 1;
  }

  function drawFlower(x, y, color, t = 1) {
    const height = Math.max(2, Math.round(6 * t));
    pix(x, y - height, 1, height, palette.tree);
    pix(x - 1, y - height + 2, 2, 1, palette.leaf);
    const bloomY = y - height - 2;
    pix(x - 1, bloomY, 3, 1, color);
    pix(x, bloomY - 1, 1, 3, color);
    pix(x, bloomY, 1, 1, palette.flower2);
  }

  let audioCtx = null;
  let soundOn = false;
  function ensureAudio() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  }

  function playBlip(freq = 720, duration = 0.06) {
    if (!soundOn || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function createHomeScene() {
    const state = {
      label: "LEVEL 1 - HOME",
      tip: "Tap the pocket park to grow green.",
      bike: { x: -20, y: 132, v: 18 },
      parks: [
        { x: 196, y: 106, w: 44, h: 18, t: 0, state: "gray" },
        { x: 246, y: 102, w: 38, h: 16, t: 1, state: "green" }
      ],
      clouds: [
        { x: 10, y: 22, v: 2 },
        { x: 120, y: 18, v: 1.4 },
        { x: 210, y: 26, v: 1.8 }
      ],
      time: 0
    };
    return {
      label: state.label,
      tip: state.tip,
      update(dt) {
        state.time += dt;
        state.bike.x += state.bike.v * dt;
        if (state.bike.x > W + 20) state.bike.x = -30;
        for (const park of state.parks) {
          if (park.state === "green") park.t = clamp(park.t + dt * 0.4, 0, 1);
        }
        for (const cloud of state.clouds) {
          cloud.x += cloud.v * dt;
          if (cloud.x > W + 30) cloud.x = -40;
        }
      },
      draw() {
        ctx.fillStyle = palette.sky;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = palette.sky2;
        ctx.fillRect(0, 0, W, 70);
        for (const cloud of state.clouds) {
          pix(cloud.x, cloud.y, 16, 5, "#1c3a2c");
          pix(cloud.x + 6, cloud.y - 2, 10, 4, "#1b3328");
        }

        pix(0, 120, W, 60, "#16402b");
        pix(0, 130, W, 50, "#133523");
        for (let i = 0; i < 16; i++) {
          const wallX = i * 20;
          pix(wallX, 96, 18, 16, palette.wall);
          pix(wallX + 2, 98, 14, 12, palette.wall2);
        }

        const tower = drawDrumTower(44, 84);
        pix(0, 135, W, 10, palette.road);
        pix(0, 145, W, 2, "#1b1f1d");
        for (const park of state.parks) drawPocketPark(park, state.time);

        pix(state.bike.x, state.bike.y - 6, 10, 4, "#d9f2e5");
        pix(state.bike.x + 2, state.bike.y - 8, 4, 3, palette.mint);
        pix(state.bike.x + 1, state.bike.y - 2, 4, 4, "#1a1a1a");
        pix(state.bike.x + 6, state.bike.y - 2, 4, 4, "#1a1a1a");

        const label = "DRUM TOWER";
        const labelW = measurePixelText(label, 1, 1);
        drawPixelText(label, tower.x + tower.w / 2 - labelW / 2, tower.topY - 10, palette.yellow, 1, 1);
        drawPixelText("POCKET PARK", 196, 92, palette.mint, 1, 1);
      },
      onTap(x, y) {
        for (const park of state.parks) {
          if (x >= park.x && x <= park.x + park.w && y >= park.y && y <= park.y + park.h) {
            park.state = "green";
          }
        }
      },
      autoTap() {
        this.onTap(state.parks[0].x + 5, state.parks[0].y + 5);
      },
      statA() {
        return "WALLS 600Y";
      },
      statB() {
        const done = state.parks.filter((p) => p.t >= 1).length;
        return `PARKS ${done}/${state.parks.length}`;
      }
    };
  }

  function createForestScene() {
    const state = {
      label: "LEVEL 2 - GREEN ENERGY",
      tip: "Tap energy orbs to grow the forest.",
      energy: 0,
      orbs: [],
      trees: [],
      bursts: [],
      spawnTimer: 0,
      time: 0
    };
    function spawnOrb() {
      if (state.orbs.length >= 5) return;
      state.orbs.push({
        x: rand(40, 280),
        y: rand(40, 90),
        phase: rand(0, Math.PI * 2)
      });
    }
    function spawnTree() {
      state.trees.push({
        x: rand(24, 296),
        y: rand(128, 166),
        scale: rand(0.7, 1.1),
        sway: rand(0, Math.PI * 2)
      });
    }
    for (let i = 0; i < 5; i++) spawnTree();
    return {
      label: state.label,
      tip: state.tip,
      update(dt) {
        state.time += dt;
        state.spawnTimer -= dt;
        if (state.spawnTimer <= 0) {
          spawnOrb();
          state.spawnTimer = rand(0.6, 1.2);
        }
        for (const burst of state.bursts) {
          burst.t = clamp(burst.t - dt * 1.6, 0, 1);
        }
        state.bursts = state.bursts.filter((b) => b.t > 0);
      },
      draw() {
        ctx.fillStyle = "#0b1f15";
        ctx.fillRect(0, 0, W, H);
        pix(0, 90, W, 90, "#0f2a1c");
        pix(0, 120, W, 60, "#123321");

        for (const tree of state.trees) {
          drawTree(tree.x, tree.y, tree.scale, state.time + tree.sway, 0.5);
        }

        for (const orb of state.orbs) {
          const bob = Math.sin(state.time * 2 + orb.phase) * 1.2;
          const ox = orb.x;
          const oy = orb.y + bob;
          pix(ox - 2, oy - 2, 4, 4, palette.mint);
          pix(ox - 1, oy - 1, 2, 2, "#e8fff1");
          pix(ox - 3, oy - 1, 1, 2, "#4ce3a4");
        }

        for (const burst of state.bursts) {
          ctx.globalAlpha = burst.t;
          pix(burst.x - 4, burst.y - 1, 8, 2, palette.yellow);
          pix(burst.x - 1, burst.y - 4, 2, 8, palette.yellow);
          ctx.globalAlpha = 1;
        }
      },
      onTap(x, y) {
        for (let i = state.orbs.length - 1; i >= 0; i--) {
          const orb = state.orbs[i];
          if (Math.abs(x - orb.x) < 6 && Math.abs(y - orb.y) < 6) {
            state.orbs.splice(i, 1);
            state.energy += 1;
            spawnTree();
            state.bursts.push({ x: orb.x, y: orb.y, t: 1 });
            return;
          }
        }
      },
      autoTap() {
        if (state.orbs[0]) this.onTap(state.orbs[0].x, state.orbs[0].y);
      },
      statA() {
        return `ENERGY ${state.energy}`;
      },
      statB() {
        return `TREES ${state.trees.length}`;
      }
    };
  }

  function createWallScene() {
    const wall = { x: 18, y: 70, w: 284, h: 40, segs: 6 };
    const state = {
      label: "LEVEL 3 - WALL BREAKER",
      tip: "Tap the wall to break and grow flowers.",
      broken: Array.from({ length: wall.segs }, () => false),
      flowers: [],
      time: 0
    };
    function spawnFlowers(segIndex) {
      const segW = wall.w / wall.segs;
      const baseX = wall.x + segW * segIndex + 3;
      const maxX = wall.x + segW * (segIndex + 1) - 3;
      for (let i = 0; i < 12; i++) {
        state.flowers.push({
          x: rand(baseX, maxX),
          y: wall.y + wall.h - 2 + rand(-4, 1),
          t: 0,
          color: i % 2 === 0 ? palette.flower : palette.flower2
        });
      }
    }

    function drawWallSegment(segX, segW) {
      pix(segX, wall.y, segW, wall.h, palette.wall);
      for (let x = segX; x < segX + segW; x += 12) {
        pix(x + 1, wall.y - 4, 8, 4, palette.wall3);
      }
      let row = 0;
      for (let y = wall.y + 6; y < wall.y + wall.h - 6; y += 6) {
        const offset = row % 2 === 0 ? 2 : 8;
        for (let x = segX + offset; x < segX + segW - 8; x += 12) {
          pix(x, y, 8, 2, palette.wall2);
        }
        row += 1;
      }
    }

    function drawCrack(segX, segW, seed) {
      const crack = "#2c2f2d";
      const jag = [0, 1, 0, 2, 1, 0, 1];
      for (let i = 0; i < jag.length; i++) {
        const y = wall.y + 3 + i * 5;
        if (y > wall.y + wall.h - 6) break;
        const leftX = segX + 1 + jag[(i + seed) % jag.length];
        const rightX = segX + segW - 2 - jag[(i + seed + 2) % jag.length];
        pix(leftX, y, 1, 3, crack);
        pix(rightX, y + 1, 1, 3, crack);
      }
      pix(segX + 2, wall.y + 1, 2, 1, crack);
      pix(segX + segW - 4, wall.y + 2, 2, 1, crack);
    }

    return {
      label: state.label,
      tip: state.tip,
      update(dt) {
        state.time += dt;
        for (const flower of state.flowers) {
          flower.t = clamp(flower.t + dt * 0.6, 0, 1);
        }
      },
      draw() {
        ctx.fillStyle = "#0c1f16";
        ctx.fillRect(0, 0, W, H);
        pix(0, 112, W, 68, "#163b28");
        pix(0, 132, W, 48, "#123321");

        const segW = wall.w / wall.segs;
        for (let i = 0; i < wall.segs; i++) {
          if (state.broken[i]) continue;
          const segX = wall.x + segW * i;
          drawWallSegment(segX, segW);
        }

        for (let i = 0; i < wall.segs; i++) {
          if (!state.broken[i]) continue;
          const holeX = wall.x + segW * i;
          pix(holeX, wall.y, segW, wall.h, "#0c1f16");
          pix(holeX + 1, wall.y + wall.h - 8, segW - 2, 6, "#1b4a32");
          drawCrack(holeX, segW, i);
        }

        for (const flower of state.flowers) {
          drawFlower(Math.round(flower.x), Math.round(flower.y), flower.color, flower.t);
        }
      },
      onTap(x, y) {
        if (x >= wall.x && x <= wall.x + wall.w && y >= wall.y && y <= wall.y + wall.h) {
          const segW = wall.w / wall.segs;
          const idx = Math.floor((x - wall.x) / segW);
          if (!state.broken[idx]) {
            state.broken[idx] = true;
            spawnFlowers(idx);
          }
        }
      },
      autoTap() {
        for (let i = 0; i < state.broken.length; i++) {
          if (!state.broken[i]) {
            this.onTap(wall.x + (i + 0.5) * (wall.w / wall.segs), wall.y + 6);
            break;
          }
        }
      },
      statA() {
        const count = state.broken.filter(Boolean).length;
        return `WALLS ${count}/${state.broken.length}`;
      },
      statB() {
        return `FLOWERS ${state.flowers.length}`;
      }
    };
  }

  const scenes = [createHomeScene(), createForestScene(), createWallScene()];
  let sceneIndex = 0;
  let scene = scenes[sceneIndex];
  let autoPlay = false;
  let autoTimer = 0;
  let sceneTimer = 0;

  function setScene(index) {
    sceneIndex = index;
    scene = scenes[sceneIndex];
    if (levelText) levelText.textContent = scene.label;
    if (tipEl) tipEl.textContent = scene.tip;
    const buttons = document.querySelectorAll(".scene-btn");
    buttons.forEach((btn) => {
      const idx = Number(btn.dataset.scene);
      btn.classList.toggle("active", idx === sceneIndex);
    });
  }

  setScene(0);

  function updateHUD() {
    if (statA && scene.statA) statA.textContent = scene.statA();
    if (statB && scene.statB) statB.textContent = scene.statB();
  }

  function handleTap(clientX, clientY, playSound = true) {
    const { x, y } = toGameCoords(clientX, clientY);
    if (scene.onTap) scene.onTap(x, y);
    if (playSound) {
      ensureAudio();
      playBlip();
    }
  }

  screen.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    handleTap(event.clientX, event.clientY, true);
  });

  document.querySelectorAll(".scene-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      setScene(Number(btn.dataset.scene));
      autoPlay = false;
      if (demoToggle) demoToggle.classList.remove("active");
    });
  });

  if (demoToggle) {
    demoToggle.addEventListener("click", () => {
      autoPlay = !autoPlay;
      demoToggle.classList.toggle("active", autoPlay);
      demoToggle.textContent = autoPlay ? "Auto Demo: On" : "Auto Demo";
    });
  }

  if (soundToggle) {
    soundToggle.addEventListener("click", () => {
      soundOn = !soundOn;
      if (soundOn) ensureAudio();
      soundToggle.classList.toggle("active", soundOn);
      soundToggle.textContent = soundOn ? "SFX On" : "SFX Off";
      playBlip(560, 0.04);
    });
  }

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener("click", () => {
      const target = screen;
      if (target.requestFullscreen) target.requestFullscreen();
      else if (target.webkitRequestFullscreen) target.webkitRequestFullscreen();
    });
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.033);
    last = now;
    if (scene.update) scene.update(dt);
    if (autoPlay) {
      autoTimer += dt;
      sceneTimer += dt;
      if (autoTimer > 0.9) {
        if (scene.autoTap) scene.autoTap();
        autoTimer = 0;
      }
      if (sceneTimer > 8) {
        setScene((sceneIndex + 1) % scenes.length);
        sceneTimer = 0;
      }
    }
    if (scene.draw) scene.draw();
    updateHUD();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
