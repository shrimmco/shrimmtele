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
    collection_name: '', // New field for Collection Name
    weight: '',          // New field for Weight
    material: '',        // New field for Material
    stockPhoto: null,
    stockPhotoCode: '',
    description: '',
    discount: '',
    hsn: '',
  });

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
          collection_name: formValues.collection_name, // Save Collection Name
          weight: formValues.weight,                   // Save Weight
          material: formValues.material,               // Save Material
          stock_photo: stockPhotoUrl,
          description: formValues.description,
          discount: formValues.discount,
          hsn: formValues.hsn,
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
