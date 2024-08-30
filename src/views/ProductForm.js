import React, { useState } from 'react';
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

function ProductForm() {
  const [formValues, setFormValues] = useState({
    name: '',
    price: '',
    size: '',
    category: '',
    stockPhoto: null,
    stockPhotoCode: '',  // New field for the 4-digit code
    description: '',
    discount: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleFileChange = (event) => {
    setFormValues({ ...formValues, stockPhoto: event.target.files[0] });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      let stockPhotoUrl = '';

      // If a code is provided, fetch the image name from the database
      if (formValues.stockPhotoCode) {
        const { data, error } = await supabase
          .from('image_codes')
          .select('image_name')
          .eq('code', formValues.stockPhotoCode)
          .single();

        if (error) throw new Error('Invalid code. Please enter a valid 4-digit code.');

        stockPhotoUrl = data.image_name;
      }

      // If a file is uploaded, use that instead of the code
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

      // Insert the new product with the correct image URL
      const { error } = await supabase.from('products').insert([
        {
          name: formValues.name,
          price: formValues.price,
          size: formValues.size,
          category: formValues.category,
          stock_photo: stockPhotoUrl,
          description: formValues.description,
          discount: formValues.discount,
        },
      ]);

      if (error) throw error;

      alert('Product added successfully!');
      setFormValues({
        name: '',
        price: '',
        size: '',
        category: '',
        stockPhoto: null,
        stockPhotoCode: '',  // Reset the code input
        description: '',
        discount: '',
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
                        <option value="Clothing">Clothing</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Accessories">Accessories</option>
                      </Input>
                    </FormGroup>
                  </Col>
                </Row>
                <Row>
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
                  <Col md="6">
                    <FormGroup>
                      <label>Or Upload Stock Photo</label>
                      <Input type="file" onChange={handleFileChange} />
                    </FormGroup>
                  </Col>
                </Row>
                <Row>
                  <Col md="12">
                    <FormGroup>
                      <label>Description</label>
                      <Input
                        placeholder="Enter product description"
                        type="textarea"
                        name="description"
                        value={formValues.description}
                        onChange={handleChange}
                        rows="4"
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <Row>
                  <Col md="12">
                    <FormGroup>
                      <label>Discount (%)</label>
                      <Input
                        placeholder="Enter discount percentage"
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
                </CardFooter>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default ProductForm;
