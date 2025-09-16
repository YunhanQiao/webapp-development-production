import { useRef } from 'react';
import Button from 'react-bootstrap/Button';

const CustomUpload = ({handleFile, buttonText, fileType, fileInstruction, inputId}) => {
  
  const hiddenFileInput = useRef(null);
  
  const handleClick = event => {
    hiddenFileInput.current.click();
  };
  
  const handleChange = event => {
    const fileUploaded = event.target.files[0];
    handleFile(fileUploaded);
  };

return (
    <>
      <div style={{
        display: 'inline-block',
        verticalAlign: 'middle'
      }}>
        <Button variant="secondary" onClick={handleClick}>{buttonText}</Button>
        {fileInstruction && <p style={{textAlign: 'center'}}>{fileInstruction}</p>}
      </div>
      <input
        type="file"
        onChange={handleChange}
        ref={hiddenFileInput}
        style={{display: 'none'}}
        accept={fileType}
        id={inputId}
      />
    </>
  );
}

export default CustomUpload;