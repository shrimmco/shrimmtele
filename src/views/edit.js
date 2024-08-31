import React, { useState, useEffect } from 'react';
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
    Alert,
} from 'reactstrap';
import { supabase } from '../supabaseClient';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUpload } from 'react-icons/fa6';

function EditProductPage() {
    const { id } = useParams(); // Get the product ID from the URL
    const navigate = useNavigate();
    const [formValues, setFormValues] = useState({
        name: '',
        price: '',
        size: '',
        category: '',
        stockPhoto: null,
        description: '',
        discount: '',
        uniqueCode: '',
    });
    const [existingPhotoUrl, setExistingPhotoUrl] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState(false);

    useEffect(() => {
        // Fetch product data when component mounts
        const fetchProduct = async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching product:', error.message);
                return;
            }

            setFormValues({
                name: data.name,
                price: data.price,
                size: data.size,
                category: data.category,
                stockPhoto: null,
                description: data.description,
                discount: data.discount,
                uniqueCode: data.unique_code || '',
            });

            // Fetch existing photo URL if it exists
            if (data.stock_photo) {
                setExistingPhotoUrl(`${process.env.REACT_APP_SUPA_URL}/storage/v1/object/public/product-images/${data.stock_photo}`);
            }
        };

        fetchProduct();
    }, [id]);

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
            let stockPhotoUrl = formValues.stockPhoto ? '' : formValues.stockPhoto;

            if (formValues.stockPhoto) {
                const { data, error } = await supabase.storage
                    .from('product-images')
                    .upload(`${Date.now()}_${formValues.stockPhoto.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '')}`, formValues.stockPhoto, {
                        cacheControl: '3600',
                        upsert: false,
                    });

                if (error) throw error;
                stockPhotoUrl = data.path;
            }

            const { error } = await supabase.from('products').update({
                name: formValues.name,
                price: formValues.price,
                size: formValues.size,
                category: formValues.category,
                stock_photo: stockPhotoUrl || formValues.stockPhoto,
                description: formValues.description,
                discount: formValues.discount,
                unique_code: formValues.uniqueCode, // Update the unique code
            }).eq('id', id);

            if (error) throw error;

            setUploadSuccess(true);
            alert('Product updated successfully!');
            navigate('/product-list'); // Redirect to the product list page
        } catch (error) {
            console.error('Error updating product:', error.message);
        }
    };

    return (
        <div className="content">
            <Row>
                <Col md="12">
                    <Card>
                        <CardHeader>
                            <h5 className="title">Edit Product</h5>
                        </CardHeader>
                        <CardBody>
                            {existingPhotoUrl && (
                                <div style={{ marginBottom: '20px' }}>
                                    <img
                                        src={existingPhotoUrl}
                                        alt="Product"
                                        style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'contain' }}
                                    />
                                </div>
                            )}
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
                                    <Col md="12">
                                        <FormGroup >
                                            <label style={{cursor:"pointer"}}>Upload Stock Photo <FaUpload></FaUpload></label>
                                            <Input style={{cursor:"pointer"}} type="file" onChange={handleFileChange} />


                                            
                                        </FormGroup>
                                        <FormGroup>
                                        <label> Or Unique Photo Code</label>
                                            <Input
                                                placeholder="Enter unique code"
                                                type="text"
                                                name="uniqueCode"
                                                value={formValues.uniqueCode}
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
                                        Save Changes
                                    </Button>
                                </CardFooter>
                            </Form>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {
                uploadSuccess && (
                    <Alert color="success" className="mt-3">
                        Product updated successfully!
                    </Alert>
                )
            }
        </div >
    );
}

export default EditProductPage;
