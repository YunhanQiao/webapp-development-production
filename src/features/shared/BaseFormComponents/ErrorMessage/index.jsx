import { forwardRef } from "react";

const ErrorMessage = forwardRef(({ id, children }, ref) => {
  return <a ref={ref} href={`#${id}`} className="alert-link">{children}<br/></a>
})

export default ErrorMessage;