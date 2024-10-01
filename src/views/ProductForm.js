import React, { useRef, useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  FormGroup,
  Form,
  Input,
  Row,
  Col,
} from 'reactstrap';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';
import { PDFDocument, rgb } from 'pdf-lib';  // Import pdf-lib
import fontkit from '@pdf-lib/fontkit';
function ProductForm() {
  const [formValues, setFormValues] = useState({
    name: '',
    price: '',
    size: '',
    category: '',
    collection_name: '', // Collection Name
    weight: '',          // Weight
    material: '',        // Material
    stockPhoto: null,
    stockPhotoCode: '',
    description: '',
    discount: '',
    hsn: '',
    diamond_weight: '',  // New field for Diamond Weight
  });
  const iframeRef = useRef(null);
  const getTextWidth = (text, fs, mul) => {
    return text.length * (fs * mul);
  };
  const printLabel = async () => {
    const { name, price, weight, hsn, diamond_weight } = formValues;
  
    // Check required fields
    if (name === '' || price === '' || weight === '' || hsn === '') {
      toast('Please enter Name, Price, Weight, and HSN code.');
      return;
    }
  
    try {
      // Fetch the PDF from Supabase
      const { data, error } = await supabase.storage
        .from('labelpdf')
        .download(`labelfinal.pdf`);
  
      if (error) {
        throw new Error('Error fetching the PDF from Supabase: ' + error.message);
      }
  
      const { data: fontData, error: fontError } = await supabase.storage
        .from('labelpdf')
        .download('cpb.ttf');
  
      if (fontError) {
        throw new Error('Error fetching the font from Supabase: ' + fontError.message);
      }
  
      // Load the existing PDF into pdf-lib
      const pdfBytes = await data.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      pdfDoc.registerFontkit(fontkit);
  
      // Load the bold font
      const fontBytes = await fontData.arrayBuffer();
      const boldFont = await pdfDoc.embedFont(fontBytes);
  
      // Get the first page of the PDF to modify
      const page = pdfDoc.getPages()[0];
  
      // Define the font sizes and color for the text
      const fontSizeNormal = 7; // Normal font size
      const fontSizeSmall = 5;  // Smaller font size for word wrap
      const color = rgb(0, 0, 0); // Black text
  
      // Function to draw text with word wrapping
      const drawTextWithWrap = (text, x, y, maxWidth, font, size,size2) => {
        let result = text.charAt(0).toUpperCase() + text.slice(1);
        const words = result.split(' ');
        let line = '';
        let lineHeight = 8; // Adjust line height as needed
        let yPosition = y;
        let fsize = size
        for (const word of words) {
          const testLine = line + word + ' ';
          const testWidth = getTextWidth(testLine, size, 0.6);
  
          if (testWidth > maxWidth) {
            fsize = size2
            // If the line is too wide, draw the current line and start a new one
            page.drawText(line, { x, y: yPosition, size:fsize, color, font });
            line = word + ' '; // Start new line
            yPosition -= 4; // Move down for the next line
          } else {
            line = testLine; // Update line
          }
        }
  
        // Draw any remaining text in the line
        if (line) {
          page.drawText(line, { x, y: yPosition, size:fsize, color, font });
        }
      };
  
      // Draw the product name with word wrapping
      drawTextWithWrap(name, 4, 36, 85, boldFont, fontSizeNormal,fontSizeSmall);
  
      // Draw other fields
      page.drawText(`MRP:${price}/-`, { x: 4, y: 14, size: 5, color, font: boldFont });
      page.drawText(`N.wt:${weight}g`, { x: 4, y: 26, size: 5, color, font: boldFont });
      page.drawText(`T.wt:${weight}g`, { x: 4, y: 22, size: 5, color, font: boldFont });
      page.drawText(`#${hsn}`, { x: 70 - getTextWidth(`#${hsn}`, 8, 0.7), y: 14, size: 8, color, font: boldFont });
  
      if (diamond_weight !== '') {
        page.drawText(`Dia.wt:${diamond_weight}ct`, { x: 4, y: 18, size: 5, color, font: boldFont });
      }
  
      // Save the modified PDF
      const modifiedPdfBytes = await pdfDoc.save();
  
      // Create a Blob URL for the modified PDF
      const modifiedPdfBlob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      const pdfBlobUrl = URL.createObjectURL(modifiedPdfBlob);
  
      // Set the iframe source to the Blob URL
      iframeRef.current.src = pdfBlobUrl;
  
      // Wait for the iframe to load and then trigger print
      iframeRef.current.onload = () => {
        iframeRef.current.contentWindow.print(); // Trigger the print dialog
      };
  
    } catch (error) {
      console.error('Error fetching or printing the PDF:', error.message);
      toast.error('Error fetching or printing the PDF: ' + error.message);
    }
  };
  
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleFileChange = (event) => {
    setFormValues({ ...formValues, stockPhoto: event.target.files[0] });
  };


 
  const generateHSNCode = async () => {
    try {
      let hsnCode;
      let isUnique = false;

      while (!isUnique) {
        hsnCode = Math.floor(10000000 + Math.random() * 90000000).toString();
        const { data, error } = await supabase
          .from('products')
          .select('hsn')
          .eq('hsn', hsnCode)
          .single();

        if (error) {
          isUnique = true;
        }
      }

      setFormValues({ ...formValues, hsn: hsnCode });
    } catch (error) {
      console.error('Error generating HSN code:', error.message);
      alert('Error generating HSN code: ' + error.message);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      let stockPhotoUrl = '';

      if (formValues.stockPhotoCode) {
        const { data, error } = await supabase
          .from('image_codes')
          .select('image_name')
          .eq('code', formValues.stockPhotoCode)
          .single();

        if (error) throw new Error('Invalid code. Please enter a valid 4-digit code.');

        stockPhotoUrl = data.image_name;
      }

      if (formValues.stockPhoto) {
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(
            `${Date.now()}_${formValues.stockPhoto.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '')}`,
            formValues.stockPhoto,
            {
              cacheControl: '3600',
              upsert: false,
            }
          );

        if (error) throw error;

        stockPhotoUrl = data.path;
      }

      const { data: hsnData, error: hsnError } = await supabase
        .from('products')
        .select('hsn')
        .eq('hsn', formValues.hsn)
        .single();

      if (hsnData) {
        throw new Error('HSN code already exists. Please enter a unique HSN code.');
      }

      const { error } = await supabase.from('products').insert([
        {
          name: formValues.name,
          price: formValues.price,
          size: formValues.size,
          category: formValues.category,
          collection_name: formValues.collection_name,
          weight: formValues.weight,
          material: formValues.material,
          stock_photo: stockPhotoUrl,
          description: formValues.description,
          discount: formValues.discount,
          hsn: formValues.hsn,
          diamond_weight: formValues.diamond_weight, // Added Diamond Weight here
        },
      ]);

      if (error) throw error;

      alert('Product added successfully!');
      setFormValues({
        name: '',
        price: '',
        size: '',
        category: '',
        collection_name: '',
        weight: '',
        material: '',
        stockPhoto: null,
        stockPhotoCode: '',
        description: '',
        discount: '',
        hsn: '',
        diamond_weight: '', // Reset Diamond Weight
      });
    } catch (error) {
      console.error('Error adding product:', error.message);
      alert('Error adding product: ' + error.message);
    }
  };

  return (
    <div className="content">
      <Row>
        <Col md="8">
          <Card>
            <CardHeader>
              <h5 className="title">Add Product</h5>
            </CardHeader>
            <CardBody>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col className="pr-md-1" md="6">
                    <FormGroup>
                      <label>Product Name</label>
                      <Input
                        placeholder="Enter product name"
                        type="text"
                        name="name"
                        value={formValues.name}
                        onChange={handleChange}
                        required
                      />
                    </FormGroup>
                  </Col>
                  <Col className="pl-md-1" md="6">
                    <FormGroup>
                      <label>Price</label>
                      <Input
                        placeholder="Enter price"
                        type="number"
                        name="price"
                        value={formValues.price}
                        onChange={handleChange}
                        required
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <Row>
                  <Col className="pr-md-1" md="6">
                    <FormGroup>
                      <label>Size</label>
                      <Input
                        placeholder="Enter size"
                        type="text"
                        name="size"
                        value={formValues.size}
                        onChange={handleChange}
                        required
                      />
                    </FormGroup>
                  </Col>
                  <Col className="pl-md-1" md="6">
                    <FormGroup>
                      <label>Category</label>
                      <Input
                        type="select"
                        name="category"
                        value={formValues.category}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Category</option>
                        <option value="Ring">Ring</option>
                        <option value="Bracelet">Bracelet</option>
                        <option value="Necklace">Necklace</option>
                        <option value="Earring">Earring</option>
                        <option value="Set">Set</option>
                        <option value="Anklet">Anklet</option>
                        <option value="Chains">Chains</option>
                        <option value="Bangles">Bangles</option>
                        <option value="Trinkets">Trinkets</option>
                        <option value="Studs">Studs</option>
                        <option value="Pendant">Pendant</option>
                        <option value="Hoops">Hoops</option>
                      </Input>
                    </FormGroup>
                  </Col>
                </Row>
                <Row>
                  <Col md="6">
                    <FormGroup>
                      <label>Collection Name</label>
                      <Input
                        placeholder="Enter collection name"
                        type="text"
                        name="collection_name"
                        value={formValues.collection_name}
                        onChange={handleChange}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <label>Weight (g)</label>
                      <Input
                        placeholder="Enter weight in grams"
                        type="number"
                        name="weight"
                        value={formValues.weight}
                        onChange={handleChange}
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <Row>
                  <Col md="6">
                    <FormGroup>
                      <label>Material</label>
                      <Input
                        placeholder="Enter material"
                        type="text"
                        name="material"
                        value={formValues.material}
                        onChange={handleChange}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <label>Stock Photo Code</label>
                      <Input
                        placeholder="Enter the 4-digit code"
                        type="text"
                        name="stockPhotoCode"
                        value={formValues.stockPhotoCode}
                        onChange={handleChange}
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <Row>
                  <Col md="6">
                    <FormGroup>
                      <label>Or Upload Stock Photo</label>
                      <Input type="file" onChange={handleFileChange} />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <label>HSN Code</label>
                      <Input
                        placeholder="Enter or generate HSN code"
                        type="text"
                        name="hsn"
                        value={formValues.hsn}
                        onChange={handleChange}
                      />
                    </FormGroup>
                    <Button
                      color="primary"
                      onClick={generateHSNCode}
                      style={{ marginTop: '30px' }}
                    >
                      Generate HSN Code
                    </Button>
                  </Col>
                </Row>
                <Row>
                  <Col md="6">
                    <FormGroup>
                      <label>Diamond Weight (ct)</label>
                      <Input
                        placeholder="Enter diamond weight in carats"
                        type="number"
                        name="diamond_weight"
                        value={formValues.diamond_weight}
                        onChange={handleChange}
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <Row>
                  <Col md="12">
                    <FormGroup>
                      <label>Description</label>
                      <Input
                        placeholder="Enter description"
                        type="textarea"
                        name="description"
                        value={formValues.description}
                        onChange={handleChange}
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <Row>
                  <Col md="6">
                    <FormGroup>
                      <label>Discount</label>
                      <Input
                        placeholder="Enter discount (%)"
                        type="number"
                        name="discount"
                        value={formValues.discount}
                        onChange={handleChange}
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <CardFooter>
                  <Button className="btn-fill" color="primary" type="submit">
                    Add Product
                  </Button>
                  <Button className="btn-fill" color="secondary" onClick={()=>{
                    printLabel()
                  }} style={{ marginLeft: '10px' }}>
                    Print Label
                  </Button>
                </CardFooter>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>
      <iframe
        ref={iframeRef}
        style={{ display: 'none' }} // Hide the iframe
        title="PDF Preview"
      />
    </div>
  );
}

export default ProductForm;
