export function Circle() {
  return (
    <div className="flex-fill d-flex align-items-center justify-content-center">
      <div className="outer-circle ml-1"></div>
    </div>
  );
}

export function DoubleCircle() {
  return (
    <div className="flex-fill d-flex align-items-center justify-content-center">
      <div className="outer-circle ml-1">
        <div className="middle-circle"></div>
      </div>
    </div>
  );
}

export function TripleCircle() {
  return (
    <div className="flex-fill d-flex align-items-center justify-content-center">
      <div className="outer-circle ml-1">
        <div className="middle-circle">
          <div className="inner-circle"></div>
        </div>
      </div>
    </div>
  );
}

export function DoubleSquare() {
  return (
    <div className="flex-fill d-flex align-items-center justify-content-center">
      <div class="outer-square">
        <div class="inner-square"></div>
      </div>
    </div>
  );
}

export function Square() {
  return (
    <div className="flex-fill d-flex align-items-center justify-content-center">
      <div class="outer-square"></div>
    </div>
  );
}

export function Triangle() {
  return (
    <div className="flex-fill d-flex align-items-center justify-content-center">
      <div class="triangle"></div>
    </div>
  );
}
