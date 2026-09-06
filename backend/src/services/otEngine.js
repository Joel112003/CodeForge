/**
 * Operational Transform Engine — conflict-free collaborative editing.
 *
 * DSA: Operational Transform (OT)
 *   - Each edit is represented as an operation: { type, position, text/count }
 *   - When two users edit concurrently, their operations may conflict
 *   - The transform function adjusts one operation against another so both
 *     can be applied to produce the same final document state
 *
 * Operation types:
 *   - INSERT: { type: "insert", position: number, text: string }
 *   - DELETE: { type: "delete", position: number, count: number }
 *   - RETAIN: { type: "retain", count: number } (skip N characters)
 *
 * This is the same algorithm used by Google Docs (simplified).
 * The server acts as the central authority with a version counter.
 * Clients send operations with their base version; the server transforms
 * them against any operations that happened in between.
 */

/**
 * Transform operation A against operation B.
 * Returns the transformed A' that produces the same result as applying B then A'.
 *
 * This is the core OT function: transform(a, b) → a'
 * where apply(apply(doc, a), b') = apply(apply(doc, b), a')
 */
export function transform(opA, opB) {
  if (!opA || !opB) return opA;

  // INSERT vs INSERT
  if (opA.type === "insert" && opB.type === "insert") {
    if (opA.position < opB.position ||
       (opA.position === opB.position && opA.clientId < opB.clientId)) {
      // A inserts before B — A stays, B shifts right
      return { ...opA };
    } else {
      // B inserts before or at same position — A shifts right by B's text length
      return { ...opA, position: opA.position + opB.text.length };
    }
  }

  // INSERT vs DELETE
  if (opA.type === "insert" && opB.type === "delete") {
    if (opA.position <= opB.position) {
      return { ...opA };
    } else if (opA.position >= opB.position + opB.count) {
      return { ...opA, position: opA.position - opB.count };
    } else {
      // Insert position is within deleted range — move to deletion start
      return { ...opA, position: opB.position };
    }
  }

  // DELETE vs INSERT
  if (opA.type === "delete" && opB.type === "insert") {
    if (opA.position >= opB.position) {
      return { ...opA, position: opA.position + opB.text.length };
    } else if (opA.position + opA.count <= opB.position) {
      return { ...opA };
    } else {
      // Delete range spans the insert position — split into two deletes
      // Simplified: extend the delete count by the inserted text length
      return {
        ...opA,
        count: opA.count + opB.text.length,
      };
    }
  }

  // DELETE vs DELETE
  if (opA.type === "delete" && opB.type === "delete") {
    if (opA.position >= opB.position + opB.count) {
      // A is entirely after B — shift left by B's count
      return { ...opA, position: opA.position - opB.count };
    } else if (opA.position + opA.count <= opB.position) {
      // A is entirely before B — no change
      return { ...opA };
    } else {
      // Overlapping deletes — compute the non-overlapping portion of A
      const overlapStart = Math.max(opA.position, opB.position);
      const overlapEnd = Math.min(opA.position + opA.count, opB.position + opB.count);
      const overlapCount = Math.max(0, overlapEnd - overlapStart);

      const newCount = opA.count - overlapCount;
      if (newCount <= 0) {
        // A was entirely consumed by B
        return { type: "noop" };
      }

      const newPosition = Math.min(opA.position, opB.position);
      return { ...opA, position: newPosition, count: newCount };
    }
  }

  return opA;
}

/**
 * Apply an operation to a document string.
 * Returns the new document string.
 */
export function applyOp(doc, op) {
  if (!op || op.type === "noop") return doc;

  switch (op.type) {
    case "insert":
      return (
        doc.slice(0, op.position) +
        op.text +
        doc.slice(op.position)
      );

    case "delete":
      return (
        doc.slice(0, op.position) +
        doc.slice(op.position + op.count)
      );

    default:
      return doc;
  }
}

/**
 * Compute the diff between two document strings as OT operations.
 * Uses a simple LCS-inspired approach for short diffs.
 *
 * Returns an array of operations that transform `oldDoc` into `newDoc`.
 */
export function computeOps(oldDoc, newDoc, clientId) {
  if (oldDoc === newDoc) return [];

  const ops = [];

  // Find common prefix
  let prefixLen = 0;
  while (
    prefixLen < oldDoc.length &&
    prefixLen < newDoc.length &&
    oldDoc[prefixLen] === newDoc[prefixLen]
  ) {
    prefixLen++;
  }

  // Find common suffix (from the end, after the prefix)
  let suffixLen = 0;
  while (
    suffixLen < oldDoc.length - prefixLen &&
    suffixLen < newDoc.length - prefixLen &&
    oldDoc[oldDoc.length - 1 - suffixLen] === newDoc[newDoc.length - 1 - suffixLen]
  ) {
    suffixLen++;
  }

  const deletedCount = oldDoc.length - prefixLen - suffixLen;
  const insertedText = newDoc.slice(prefixLen, newDoc.length - suffixLen);

  if (deletedCount > 0) {
    ops.push({
      type: "delete",
      position: prefixLen,
      count: deletedCount,
      clientId,
    });
  }

  if (insertedText.length > 0) {
    ops.push({
      type: "insert",
      position: prefixLen,
      text: insertedText,
      clientId,
    });
  }

  return ops;
}

/**
 * Transform a client operation against a series of server operations.
 * Used when a client's base version is behind the server's current version.
 */
export function transformAgainstAll(clientOp, serverOps) {
  let transformed = clientOp;
  for (const serverOp of serverOps) {
    transformed = transform(transformed, serverOp);
    if (transformed.type === "noop") break;
  }
  return transformed;
}
