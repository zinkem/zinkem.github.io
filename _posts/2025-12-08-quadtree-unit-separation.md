---
layout: post
title: "Quadtree Spatial Partitioning: From O(n²) to O(n log n)"
date: 2025-12-08 12:00:00 -0700
project: artcraft
---

*Retrospective from the ArtCraft project - a Warcraft-style RTS built with Love2D*

---

## Objective

Replace O(n²) algorithms with quadtree-based spatial partitioning for:
1. **Unit Separation** - checking for overlapping units
2. **Combat Targeting** - finding enemies in sight range

## Phase 1: Unit Separation

### Problem

The original `separateUnits()` function used nested loops to check every pair of units:

```lua
for i = 1, #allUnits do
    for j = i + 1, #allUnits do
        -- check distance between units[i] and units[j]
    end
end
```

With 3 passes for better separation, this results in:
- 20 units: 570 pair checks/frame
- 100 units: 14,850 pair checks/frame
- 200 units: 59,700 pair checks/frame

## Solution: Quadtree Spatial Partitioning

A quadtree recursively subdivides 2D space into quadrants, allowing O(log n) neighbor queries instead of O(n) scans.

### Implementation

Created `quadtree.lua` with:
- `Quadtree.new(x, y, w, h)` - create tree for world bounds
- `insert(obj, getX, getY)` - add object using accessor functions
- `query(cx, cy, radius, found, getX, getY)` - find objects within radius
- `remove(obj, getX, getY)` - remove object from tree
- `update(obj, oldX, oldY, getX, getY)` - move object to new position
- `clear()` - remove all objects (reuse tree structure)

### Key Design Decisions

**1. Accessor Functions vs Direct Property Access**

Used function parameters `getX`, `getY` to extract coordinates:
```lua
local function getUnitX(unit) return unit.worldX end
local function getUnitY(unit) return unit.worldY end
qt:insert(unit, getUnitX, getUnitY)
```

This keeps the quadtree generic - works with any object type.

**2. Persistent Tree with Per-Frame Refresh**

Initial implementation rebuilt the quadtree 3 times per frame (once per separation pass). User correctly identified this as wasteful.

Final approach:
- Quadtree persists as module-level variable
- Refreshed once at start of each frame via `refreshUnitQuadtree(allUnits)`
- Separation passes just query the existing tree

```lua
-- In Gameplay.update(), once per frame:
refreshUnitQuadtree(allUnits)

-- In separateUnits(), just use it:
local nearby = qt:query(a.worldX, a.worldY, MAX_SEPARATION_RADIUS, nil, getUnitX, getUnitY)
```

## Evolution of Approach

### Attempt 1: Rebuild Every Pass (Rejected)

Built new quadtree, then rebuilt it after each of 3 separation passes:
```lua
local qt = Quadtree.new(...)
for _, unit in ipairs(allUnits) do qt:insert(...) end

for pass = 1, 3 do
    if pass > 1 then
        qt:clear()
        for _, unit in ipairs(allUnits) do qt:insert(...) end  -- WASTEFUL
    end
    -- separation logic
end
```

**Benchmark result**: Slower than O(n²) for all unit counts under 200.

### Attempt 2: Update Tree Incrementally (Partially Implemented)

Added `remove()` and `update()` methods to modify tree when units move:
```lua
if map:isWorldPosPassable(ax, ay) then
    a.worldX, a.worldY = ax, ay
    qt:update(a, aOldX, aOldY, getUnitX, getUnitY)
end
```

**Issue**: Still rebuilding tree initially, and tracking old positions added complexity.

### Attempt 3: One Refresh Per Frame (Final)

User insight: "Why can't we just do a single O(n) pass over all units at the end of each frame?"

This is the key optimization:
- Building tree once per frame is O(n)
- Queries during separation are O(log n) each
- Total: O(n) + O(n * log n) = O(n log n)

vs O(n²) for the old approach.

## Benchmark Results

Ran `love . --benchmark-quadtree`:

| Scenario | Units | O(n²) | Quadtree | Result |
|----------|-------|-------|----------|--------|
| Early game | 20 | 0.12s | 0.33s | 0.4x slower |
| Mid game | 50 | 0.31s | 0.41s | 0.7x slower |
| Late game | 100 | 0.60s | 0.52s | **1.2x faster** |
| Stress test | 200 | 1.20s | 0.61s | **2.0x faster** |
| Extreme | 500 | 2.96s | 0.80s | **3.7x faster** |

### Crossover Point

Quadtree becomes faster at approximately **75-100 units**.

---

## Phase 2: Combat Targeting Optimization

After unit separation was optimized, we extended the quadtree to combat targeting - the `checkForEnemies()` function where each unit scans for nearby enemies.

### Original Implementation

```lua
function Unit:checkForEnemies(allUnits, allBuildings)
    for _, unit in ipairs(allUnits) do
        if unit ~= self and unit.team ~= myTeam and unit.hp > 0 then
            local dist = self:distanceTo(unit)
            if dist <= sightRange then
                self:setAttackTarget(unit)
                return
            end
        end
    end
end
```

Each unit scans ALL units (O(n)) to find enemies. With n units, total is O(n²) per frame.

### Initial Benchmark: Surprising Results

First benchmark showed quadtree was **slower** for combat:

| Units | O(n) linear | Quadtree findClosest |
|-------|-------------|---------------------|
| 100 | 0.15 ms | 0.38 ms (0.4x slower) |
| 500 | 1.1 ms | 4.0 ms (0.3x slower) |
| 1000 | 2.2 ms | 12.1 ms (0.2x slower) |

### Analysis: Why Was Quadtree Slower?

Investigated several hypotheses:

**1. Closure Creation Overhead?**

Each query created a new filter function:
```lua
local function isEnemy(unit)
    return unit ~= self and unit.team ~= myTeam and unit.hp > 0
end
quadtree:findClosest(..., isEnemy)
```

Tested with shared filter state - minimal improvement (~5%).

**2. findClosest vs findAny Behavior**

Realized the original code found *any* enemy (first match), but `findClosest` scans *all* candidates to find the nearest. Different semantics!

Added `findAny()` - early exit on first match:
```lua
function Quadtree:findAny(cx, cy, radius, getX, getY, filterFn)
    -- Check objects in this node first
    for _, obj in ipairs(self.objects) do
        if inRadius and filterFn(obj) then
            return obj  -- Early exit!
        end
    end
    -- Recurse into children with early exit
    if self.divided then
        local found = self.nw:findAny(...)
        if found then return found end
        -- ... etc
    end
end
```

**3. The Real Issue: Benchmark Distribution**

The critical insight came from analyzing the benchmark setup:

```lua
-- Original benchmark: alternating teams
team = (i % 2) + 1  -- Unit 1 = team 1, Unit 2 = team 2, etc.
```

With alternating teams, the linear scan **always** finds an enemy in positions 1-2 of the array. The first enemy is always nearby in the iteration order!

### Realistic Scenario Testing

Real RTS games have teams **clustered** in separate areas. Created a realistic test:

```lua
if clustered then
    -- Team 1: left half of map
    for i = 1, halfUnits do
        worldX = random() * worldSize * 0.3 + worldSize * 0.1
        team = 1
    end
    -- Team 2: right half of map
    for i = 1, count - halfUnits do
        worldX = random() * worldSize * 0.3 + worldSize * 0.6
        team = 2
    end
end
```

### Final Benchmark: Context Matters

| Scenario | Units | Mixed (enemies nearby) | Clustered (realistic) |
|----------|-------|------------------------|----------------------|
| Late game | 100 | 0.6x slower | 0.7x slower |
| Stress | 200 | 0.7x slower | 0.9x slower |
| Extreme | 500 | 0.7x slower | **1.2x FASTER** |
| Target | 1000 | 0.7x slower | **1.5x FASTER** |

### Key Insights

1. **Distribution matters more than algorithm complexity**
   - When enemies are everywhere (mixed), linear scan wins by finding one immediately
   - When teams are separated (realistic RTS), must search past many allies

2. **Benchmark design affects conclusions**
   - Naive benchmark with alternating teams was misleading
   - Realistic distribution showed the quadtree's value

3. **Early exit is crucial for combat targeting**
   - `findAny()` returns first match (matches original behavior)
   - `findClosest()` must scan all candidates (different semantics, slower)

4. **Crossover point depends on use case**
   - Unit separation: ~75-100 units
   - Combat targeting (clustered): ~500 units
   - Combat targeting (mixed): quadtree never wins

---

## Phase 3: Capacity Tuning - The Interplay of Two Algorithms

After establishing that the quadtree works, we discovered a significant optimization opportunity by tuning the tree's configuration parameters. This phase revealed how two algorithms (tree subdivision and linear scanning within nodes) interact to determine overall performance.

### The Two Competing Operations

A quadtree's performance depends on the balance between:

1. **Tree traversal** - Walking down the tree hierarchy to find relevant nodes
2. **Linear scanning** - Checking each object within a leaf node

The `maxObjects` (capacity) parameter controls when nodes subdivide:
- **Low capacity (4)**: More subdivision -> deeper trees -> more traversal overhead
- **High capacity (16+)**: Less subdivision -> shallower trees -> more linear scanning per node

### Benchmark: Varying Depth and Capacity

Results with 1000 clustered units:

| Configuration | ms/frame |
|--------------|----------|
| depth=4, cap=4 | 2.148 |
| depth=6, cap=4 | 1.612 |
| depth=8, cap=4 | 1.618 |
| depth=10, cap=4 | 1.677 |
| depth=8, cap=8 | 1.224 |
| **depth=8, cap=16** | **0.897** |

### Key Finding: Capacity Dominates

Increasing capacity from 4 to 16 yielded a **1.8x speedup** - larger than any depth change.

Why? With clustered units:
- Teams occupy ~30% of the map each
- High-density clusters mean many units per spatial region
- Linear scan within a node of 16 units is fast (cache-friendly, no function calls)
- Avoiding subdivision reduces tree overhead significantly

### The Algorithm Interplay

This optimization highlights a common pattern in spatial data structures:

```
Total Cost = (Tree Traversal Cost) + (Leaf Scanning Cost)

With capacity=4:  Many nodes x cheap traversal + few objects x cheap scan
With capacity=16: Few nodes x cheap traversal + more objects x still-cheap scan
```

The "still-cheap" part is key. Scanning 16 objects with simple distance checks is negligible compared to:
- Function call overhead for tree traversal
- Cache misses from jumping between node tables
- Table lookups for child node references

---

## Lessons Learned

1. **Textbook defaults aren't always optimal**
   - Standard quadtree tutorials use capacity=4
   - Real workloads may benefit from higher capacities

2. **Profile before assuming**
   - Initial assumption: "More subdivision = faster queries"
   - Reality: Subdivision overhead exceeded linear scan cost

3. **Consider data distribution**
   - Clustered data (RTS teams) benefits from larger node capacity
   - Uniformly distributed data might prefer smaller capacity

4. **Two algorithms, one data structure**
   - Quadtrees combine tree traversal and linear scanning
   - Tuning the balance point is often more impactful than algorithmic changes

5. **Always question benchmark validity**
   - Does the test distribution match real usage?
   - Are we measuring the right thing?

6. **Semantics matter**
   - "Find any enemy" vs "find closest enemy" have different performance characteristics
   - Match the original behavior unless there's a reason to change it

## Conclusion

Quadtree provides significant performance gains for late-game scenarios with many units. The key insight was refreshing the tree once per frame rather than rebuilding per-pass. Small game overhead is acceptable given the late-game gains.

For combat targeting specifically, the quadtree only wins in realistic clustered scenarios at 500+ units. At the target scale of 1000 units with realistic team clustering, combat targeting is **1.5x faster**.
