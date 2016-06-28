'use strict';

require('../../../TestHelper');

/* global bootstrapModeler, inject */


var coreModule = require('lib/core'),
    bendpointsModule = require('diagram-js/lib/features/bendpoints'),
    modelingModule = require('lib/features/modeling'),
    labelEditingModule = require('lib/features/label-editing');

var canvasEvent = require('../../../util/MockEvents').createCanvasEvent;

var testModules = [
  coreModule,
  modelingModule,
  labelEditingModule,
  bendpointsModule
];


describe('modeling - label layouting', function() {

  describe('should create label', function() {

    var diagramXML = require('./LabelLayouting.initial.bpmn');

    beforeEach(bootstrapModeler(diagramXML, {
      modules: testModules
    }));


    it('horizontal', inject(function(modeling, elementRegistry) {

      // given
      var element1 = elementRegistry.get('StartEvent_1'),
          element2 = elementRegistry.get('ExclusiveGateway_2');

      // when
      var connection = modeling.connect(element1, element2);

      // then
      expect(connection.label.x).to.be.equal(427);
      expect(connection.label.y).to.be.equal(332);
    }));


    it('vertical', inject(function(modeling, elementRegistry) {

      // given
      var element1 = elementRegistry.get('StartEvent_1'),
          element2 = elementRegistry.get('ExclusiveGateway_1');

      // when
      var connection = modeling.connect(element1, element2);

      // then
      expect(connection.label.x).to.be.equal(292);
      expect(connection.label.y).to.be.equal(219.5);
    }));

  });


  describe('should move label', function() {

    var diagramXML = require('./LabelLayouting.move.bpmn');

    beforeEach(bootstrapModeler(diagramXML, {
      modules: testModules
    }));

    describe('on segment move', function() {

      it('left - no relayout', inject(function(elementRegistry, connectionSegmentMove, dragging) {

        // given
        var connection = elementRegistry.get('SequenceFlow_B'),
            labelPosition = getLabelPosition(connection);

        // when
        connectionSegmentMove.start(canvasEvent({ x: 0, y: 0 }), connection, 2);

        dragging.move(canvasEvent({ x: -30, y: 0 }));

        dragging.end();

        // then
        expectLabelMoved(connection, labelPosition, { x: -30, y: 0 });
      }));


      it('left - remove bendpoint', inject(function(elementRegistry, connectionSegmentMove, dragging) {

        // given
        var connection = elementRegistry.get('SequenceFlow_B'),
            labelPosition = getLabelPosition(connection);

        // when
        connectionSegmentMove.start(canvasEvent({ x: 0, y: 0 }), connection, 2);

        dragging.move(canvasEvent({ x: -70, y: 0 }));

        dragging.end();

        // then
        expectLabelMoved(connection, labelPosition, { x: -70, y: 23 });
      }));


      it('right - no relayout', inject(function(elementRegistry, connectionSegmentMove, dragging) {

        // given
        var connection = elementRegistry.get('SequenceFlow_B'),
            labelPosition = getLabelPosition(connection);

        // when
        connectionSegmentMove.start(canvasEvent({ x: 0, y: 0 }), connection, 2);

        dragging.move(canvasEvent({ x: 30, y: 0 }));

        dragging.end();

        // then
        expectLabelMoved(connection, labelPosition, { x: 30, y: 0 });
      }));


      it('right - remove bendpoint', inject(function(elementRegistry, connectionSegmentMove, dragging) {

        // given
        var connection = elementRegistry.get('SequenceFlow_B'),
            labelPosition = getLabelPosition(connection);

        // when
        connectionSegmentMove.start(canvasEvent({ x: 0, y: 0 }), connection, 2);

        dragging.move(canvasEvent({ x: 70, y: 0 }));

        dragging.end();

        // then
        expectLabelMoved(connection, labelPosition, { x: 70, y: -17 });
      }));


      it('down', inject(function(elementRegistry, connectionSegmentMove, dragging) {

        // given
        var connection = elementRegistry.get('SequenceFlow_C'),
            labelPosition = getLabelPosition(connection);

        // when
        connectionSegmentMove.start(canvasEvent({ x: 0, y: 0 }), connection, 2);

        dragging.move(canvasEvent({ x: 0, y: 70 }));

        dragging.end();

        // then
        expectLabelMoved(connection, labelPosition, { x: 0, y: 70 });

      }));


      it('up - remove two bendpoints', inject(function(elementRegistry, connectionSegmentMove, dragging) {

        // given
        var connection = elementRegistry.get('SequenceFlow_C'),
            labelPosition = getLabelPosition(connection);

        // when
        connectionSegmentMove.start(canvasEvent({ x: 0, y: 0 }), connection, 2);

        dragging.move(canvasEvent({ x: 0, y: -90 }));

        dragging.end();

        // then
        expectLabelMoved(connection, labelPosition, { x: -39, y: -85 });

      }));

    });

    describe('on reconnect', function() {

      it('start', inject(function(elementRegistry, modeling) {

        // given
        var connection = elementRegistry.get('SequenceFlow_D'),
            shape = elementRegistry.get('Task_1');

        // when
        modeling.reconnectStart(connection, shape, { x: 0, y: 0 });

        // then
        expect(Math.round(connection.label.x)).to.be.equal(528);
        expect(Math.round(connection.label.y)).to.be.equal(137);

      }));


      it('end', inject(function(elementRegistry, modeling) {

        // given
        var connection = elementRegistry.get('SequenceFlow_A'),
            shape = elementRegistry.get('Task_2');

        // when
        modeling.reconnectEnd(connection, shape, { x: 294, y: 270 });

        // then
        expect(Math.round(connection.label.x)).to.be.equal(220);
        expect(Math.round(connection.label.y)).to.be.equal(178);

      }));

    });

    describe('on shape move', function() {

      it('down', inject(function(elementRegistry, modeling) {

        // given
        var connection = elementRegistry.get('SequenceFlow_E'),
            shape = elementRegistry.get('Task_4'),
            labelPosition = getLabelPosition(connection);

        // when
        modeling.moveShape(shape, { x: 0, y: 100 });

        // then
        expectLabelMoved(connection, labelPosition, { x: 0, y: 100 });

      }));

    });

    describe('on bendpoint add/delete/moving', function() {

      //@janstuemmel: maybe different behavior

      it('moving', inject(function(elementRegistry, bendpointMove, dragging) {

        // given
        var connection = elementRegistry.get('SequenceFlow_B');

        // when
        bendpointMove.start(canvasEvent({ x: 0, y: 0 }), connection, 1);

        dragging.move(canvasEvent({ x: 455 + 50, y: 120 }));

        dragging.end();

        // then
        expect(Math.round(connection.label.x)).to.be.equal(425);
        expect(Math.round(connection.label.y)).to.be.equal(170);

      }));


      it('remove', inject(function(elementRegistry, bendpointMove, dragging) {

        // given
        var connection = elementRegistry.get('SequenceFlow_B');

        // when
        bendpointMove.start(canvasEvent({ x: 0, y: 0 }), connection, 1);

        dragging.move(canvasEvent({ x: 455, y: 120 + 160 }));

        dragging.end();

        // then
        expect(Math.round(connection.label.x)).to.be.equal(396);
        expect(Math.round(connection.label.y)).to.be.equal(171);

      }));


      it('add', inject(function(elementRegistry, bendpointMove, dragging, canvas) {

        // given
        var connection = elementRegistry.get('SequenceFlow_B');

        // when
        bendpointMove.start(canvasEvent({ x: 0, y: 0 }), connection, 2, true);

        dragging.hover({
          element: connection,
          gfx: canvas.getGraphics(connection)
        });

        dragging.move(canvasEvent({ x: 600, y: 200 }));

        dragging.end();

        // then
        expect(Math.round(connection.label.x)).to.be.equal(478);
        expect(Math.round(connection.label.y)).to.be.equal(130);

      }));

    });

    describe('special cases', function() {

      // @janstuemmel: failing - solve with ticket #479
      it.skip('should behave properly, right after importing', inject(function(elementRegistry, connectionSegmentMove, dragging, modeling) {

        // given
        var connection = elementRegistry.get('SequenceFlow_C'),
            labelPosition = getLabelPosition(connection),
            label = connection.label;

        // when
        connectionSegmentMove.start(canvasEvent({ x: 0, y: 0 }), connection, 2);

        dragging.move(canvasEvent({ x: 0, y: 70 }));

        dragging.end();

        // move label
        modeling.moveShape(label, { x: 40, y: -30 });

        // drag again
        connectionSegmentMove.start(canvasEvent({ x: 0, y: 0 }), connection, 1);

        dragging.move(canvasEvent({ x: -20, y: 0 }));

        dragging.end();

        // then
        expectLabelMoved(connection, labelPosition, { x: 20, y: 40 });

      }));

      describe('label out of bounds', function() {

        it('should reposition on right segment', inject(function(elementRegistry, connectionSegmentMove, dragging) {

          // given
          var connection = elementRegistry.get('SequenceFlow_E'),
              labelPosition = getLabelPosition(connection);

          // when
          connectionSegmentMove.start(canvasEvent({ x: 0, y: 0 }), connection, 2);

          dragging.move(canvasEvent({ x: -100, y: 0 }));

          dragging.end();

          // then
          expectLabelMoved(connection, labelPosition, { x: -45, y: -70 });

        }));


        it('should not move label that is out of bounds', inject(function(elementRegistry, connectionSegmentMove, dragging, modeling) {

          // given
          var connection = elementRegistry.get('SequenceFlow_C');

          // move shape away
          modeling.moveShape(connection.label, { x: 0, y: 140 });

          var labelPosition = getLabelPosition(connection);

          // when
          connectionSegmentMove.start(canvasEvent({ x: 0, y: 0 }), connection, 2);

          dragging.move(canvasEvent({ x: 0, y: 30 }));

          dragging.end();

          // then
          expectLabelMoved(connection, labelPosition, { x: 0, y: 0 });
        }));


        it('should not move label that is out of bounds in corner', inject(function(elementRegistry, connectionSegmentMove, dragging, modeling) {

          // given
          var connection = elementRegistry.get('SequenceFlow_C');

          // move shape away
          modeling.moveShape(connection.label, { x: 50, y: 0 });

          var labelPosition = getLabelPosition(connection);

          // when
          connectionSegmentMove.start(canvasEvent({ x: 0, y: 0 }), connection, 2);

          dragging.move(canvasEvent({ x: 0, y: 30 }));

          dragging.end();

          // then
          expectLabelMoved(connection, labelPosition, { x: 0, y: 0 });
        }));

      });

    });

  });

});



function getLabelPosition(connection) {

  var label = connection.label;

  var mid = {
    x: label.x + (label.width / 2),
    y: label.y + (label.height / 2)
  };

  return mid;
}


function expectLabelMoved(connection, oldPosition, expectedDelta) {

  var newPosition = getLabelPosition(connection);

  var delta = {
    x: Math.round(newPosition.x - oldPosition.x),
    y: Math.round(newPosition.y - oldPosition.y)
  };

  expect(delta).to.eql(expectedDelta);
}
