'use strict';

var GeometricUtil = require('./GeometricUtil');

var getAttachment = require('./FooUtil').getAttachment;

var reduce = require('lodash/collection/reduce');

var LABEL_LINE_BOUNDS = 120;

function getMinDistanceLineIndex(label, waypoints) {

  var distances = [];

  // push label/line distances if label is in bounds
  for (var i=0; i<waypoints.length-1; i++) {

    var line = [ waypoints[i], waypoints[i+1] ];

    var distance = GeometricUtil.getDistancePointLine(label, line);

    if (labelInBounds(label, line)) distances.push({ idx: i, distance: distance });
  }

  // get the minimum distance
  var min = reduce(distances, distanceMin);

  // if min, return the line index of the line which is the closest to label
  if (min) return min.idx;

  else return null;
}

function labelInBounds(label, line) {

  var pfPoint = GeometricUtil.perpendicularFoot(label, line),
      distance = GeometricUtil.getDistancePointLine(label, line);

  var a = line[0], b = line[1];

  var r;

  // vertical line
  if (a.x === b.x) r = ( pfPoint.y - a.y ) / ( b.y-a.y );

  // horizontal and other lines
  else r = ( pfPoint.x - a.x ) / ( b.x-a.x );

  // inBounds if r between 0,1 and distance to label lower then bound
  return 0 < r && r < 1 && distance < LABEL_LINE_BOUNDS ? true : false;
}

module.exports.labelInBounds = labelInBounds;

function findNewLabelLineStartIndex(oldWaypoints, newWaypoints, index, hints) {

  var offset = newWaypoints.length - oldWaypoints.length;

  // segmentMove happend
  if (hints.segmentMove) {

    var oldSegmentStartIndex = hints.segmentMove.segmentStartIndex,
        newSegmentStartIndex = hints.segmentMove.newSegmentStartIndex;

    // if label was on moved segment return new segment index
    if (index === oldSegmentStartIndex)
      return newSegmentStartIndex;

    // label is after new segment index
    if (index >= newSegmentStartIndex)
      return (index+offset < newSegmentStartIndex) ? newSegmentStartIndex : index+offset;

    // if label is before new segment index
    else
      return index;
  }

  // bendpointMove happend
  if (hints.bendpointMove) {

    var insert = hints.bendpointMove.insert,
        bendpointIndex = hints.bendpointMove.bendpointIndex;

    // waypoints length didnt change
    if (offset === 0) return index;

    else {

      // label before new/removed bendpoint
      if (index < bendpointIndex) return index;

      // label behind new/removed bendpoint
      else return insert ? index + 1 : index - 1;
    }
  }

  // start/end changed
  if (offset === 0) return index;

  if (hints.connectionStart) {
    return (index === 0) ? 0 : null;
  }

  if (hints.connectionEnd) {
    return (index === oldWaypoints.length - 2) ? newWaypoints.length - 2 : null;
  }

  // if nothing fits, return null
  return null;
}

module.exports.findNewLabelLineStartIndex = findNewLabelLineStartIndex;


/**
 * Calculate the required adjustment (move delta) for the given label
 * after the connection waypoints got updated.
 *
 * @param {djs.model.Label} label
 * @param {Array<Point>} newWaypoints
 * @param {Array<Point>} oldWaypoints
 * @param {Object} hints
 *
 * @return {Point} delta
 */
function getLabelAdjustment(label, newWaypoints, oldWaypoints, hints) {

  var x = 0,
      y = 0;

  // the middle of the label
  var labelPosition = getLabelMid(label);

  // get closest attachment
  var attachement = getAttachment(labelPosition, oldWaypoints);

  var oldLabelLineIndex = attachement.segmentIndex;


  console.log(attachement);
  //
  // return { x: 0, y: 0 };
  //
  // // get the first index of the old label line
  // var oldLabelLineIndex = getMinDistanceLineIndex(labelPosition, oldWaypoints);
  //
  //
  // // is null if label is out of bounds
  // if (oldLabelLineIndex === null) return { x: x, y: y };

  var newLabelLineIndex = findNewLabelLineStartIndex(oldWaypoints, newWaypoints, oldLabelLineIndex, hints);

  // should never happen
  if (newLabelLineIndex === null  ||
      newLabelLineIndex < 0       ||
      newLabelLineIndex > newWaypoints.length - 2) {
    throw new Error('ALTAAA');
  }

  var oldLabelLine = getLine(oldWaypoints, oldLabelLineIndex),
      newLabelLine = getLine(newWaypoints, newLabelLineIndex),
      oldFoot = GeometricUtil.perpendicularFoot(labelPosition, oldLabelLine);

  var relativeFootPosition = getRelativeFootPosition(oldLabelLine, oldFoot),
      angleDelta = getAngleDelta(oldLabelLine, newLabelLine);

  // foot point on the new label line
  var newFoot = {
    x: (newLabelLine[1].x - newLabelLine[0].x) * relativeFootPosition + newLabelLine[0].x,
    y: (newLabelLine[1].y - newLabelLine[0].y) * relativeFootPosition + newLabelLine[0].y
  };

  // the rotated vector to label
  var newLabelVector = GeometricUtil.rotateVector({
    x: labelPosition.x - oldFoot.x,
    y: labelPosition.y - oldFoot.y
  }, angleDelta);

  // the new relative position
  x = newFoot.x + newLabelVector.x - labelPosition.x;
  y = newFoot.y + newLabelVector.y - labelPosition.y;

  return { x: x, y: y };
}

module.exports.getLabelAdjustment = getLabelAdjustment;


//// HELPERS ///////

function distanceMin(d, last) {
  return d.distance < last.distance ? d : last;
}

function getLabelMid(label) {
  return {
    x: label.x + label.width / 2,
    y: label.y + label.height / 2
  };
}

function getAngleDelta(l1, l2) {
  var a1 = GeometricUtil.getAngle(l1),
      a2 = GeometricUtil.getAngle(l2);
  return a2 - a1;
}

function getLine(waypoints, idx) {
  return [ waypoints[idx], waypoints[idx+1] ];
}

function getRelativeFootPosition(line, foot) {
  var length = GeometricUtil.getDistancePointPoint(line[0], line[1]),
      lengthToFoot = GeometricUtil.getDistancePointPoint(line[0], foot);
  return lengthToFoot / length;
}
