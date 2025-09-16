// ALTERNATIVE VERSION with colored circles instead of icons
// Replace the badge sections with this code if you prefer:

/* Upcoming Tournaments */
{
  upcoming.length > 0 && (
    <>
      <Row className="justify-content-center mt-4">
        <Col sm="9">
          <h4 className="mb-3">
            <span
              className="badge bg-primary me-2"
              style={{
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "8px",
              }}
            ></span>
            Upcoming
            <small className="text-muted ms-2">({upcoming.length})</small>
          </h4>
          {/* ... rest of table ... */}
        </Col>
      </Row>
    </>
  );
}

/* In Progress Tournaments */
{
  inProgress.length > 0 && (
    <>
      <Row className="justify-content-center mt-4">
        <Col sm="9">
          <h4 className="mb-3">
            <span
              className="badge bg-success me-2"
              style={{
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "8px",
              }}
            ></span>
            In Progress
            <small className="text-muted ms-2">({inProgress.length})</small>
          </h4>
          {/* ... rest of table ... */}
        </Col>
      </Row>
    </>
  );
}

/* Completed Tournaments */
{
  completed.length > 0 && (
    <>
      <Row className="justify-content-center mt-4">
        <Col sm="9">
          <h4 className="mb-3">
            <span
              className="badge bg-secondary me-2"
              style={{
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "8px",
              }}
            ></span>
            Completed
            <small className="text-muted ms-2">({completed.length})</small>
          </h4>
          {/* ... rest of table ... */}
        </Col>
      </Row>
    </>
  );
}
