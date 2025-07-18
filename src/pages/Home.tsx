import React, { useState, useEffect } from 'react';
import { Button, Pagination, Select, Card, Row, Col, Typography, Spin, Empty, message, Input, Modal, Form, Upload, Space } from 'antd';
import { PlusOutlined, UserOutlined, ShoppingOutlined, HeartOutlined, SearchOutlined, CameraOutlined, DeleteOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { RootState } from '../store';
import ProductCard from '../components/Product/ProductCard';
import Sidebar from '../components/Layout/Sidebar';
import { productAPI, subCategoryAPI, categoryAPI } from '../utils/api';

interface Product {
  _id: string;
  name: string;
  description: string;
  subCategoryId: string;
  variants: Array<{ ram: string; price: number; quantity: number }>;
  images: string[];
}

interface SubCategory {
  _id: string;
  name: string;
  categoryId: string;
}

interface Category {
  _id: string;
  name: string;
  description?: string;
}

interface Variant {
  ram: string;
  price: number;
  quantity: number;
}

const { TextArea } = Input;
const { Title, Text } = Typography;

const Home: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [searchParams] = useSearchParams();
  
  // Local state for products and pagination
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All categories');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  
  // Get search query from URL
  const searchQuery = searchParams.get('search') || '';
  
  // Add Product Modal State
  const [isAddProductModalVisible, setIsAddProductModalVisible] = useState(false);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [variants, setVariants] = useState<Variant[]>([
    { ram: '', price: 0, quantity: 1 }
  ]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [form] = Form.useForm();
  const [modalLoading, setModalLoading] = useState(false);

  // Add Category Modal State
  const [isAddCategoryModalVisible, setIsAddCategoryModalVisible] = useState(false);
  const [categoryForm] = Form.useForm();
  const [categoryModalLoading, setCategoryModalLoading] = useState(false);

  // Add Sub Category Modal State
  const [isAddSubCategoryModalVisible, setIsAddSubCategoryModalVisible] = useState(false);
  const [subCategoryForm] = Form.useForm();
  const [subCategoryModalLoading, setSubCategoryModalLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch categories for the sub category modal
  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAllCategories();
      const categoriesData = response.data || response.categories || response;
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  // Fetch subcategories for the modal
  const fetchSubCategories = async () => {
    try {
      const response = await subCategoryAPI.getAllSubCategories();
      const subCategoriesData = response.data || response.subCategories || response;
      setSubCategories(subCategoriesData);
    } catch (error) {
      console.error('Failed to fetch subcategories:', error);
    }
  };

  // Fetch products based on current selection
  const fetchProducts = async (page: number = 1, size: number = 10) => {
    try {
      setLoading(true);
      
      // Build the API parameters
      const apiParams: any = {
        page,
        limit: size
      };
      
      // Add search if provided
      if (searchQuery.trim()) {
        apiParams.search = searchQuery.trim();
      }
      
      // Add subCategory if selected
      if (selectedSubCategory) {
        apiParams.subCategory = selectedSubCategory;
      }
  
      
      const response = await productAPI.getAllProducts(apiParams);
      
      // Handle different response formats
      const productsData = response.data || response.products || response;
      const total = response.total || response.totalProducts || productsData.length;
      
      // Check if products have subCategoryId field
      if (productsData.length > 0) {
 
        setProducts(productsData);
        setTotalProducts(productsData.length);
        
       
      } else {
        console.log('No products received from API');
        setProducts(productsData);
        setTotalProducts(total);
      }
      
      setCurrentPage(page);
      
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      message.error('Failed to load products');
      setProducts([]);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  };

  // Handle Add Category Modal
  const showAddCategoryModal = () => {
    setIsAddCategoryModalVisible(true);
  };

  const handleAddCategoryCancel = () => {
    setIsAddCategoryModalVisible(false);
    categoryForm.resetFields();
  };

  const handleAddCategory = async (values: any) => {
    try {
      setCategoryModalLoading(true);
      
      const categoryData = {
        name: values.categoryName,
        description: values.description || ''
      };

      console.log('Submitting category data:', categoryData);
      
      const response = await categoryAPI.createCategory(categoryData);
      console.log('Category created successfully:', response);
      
      message.success('Category added successfully!');
      handleAddCategoryCancel();
      
    } catch (error) {
      console.error('Failed to create category:', error);
      message.error('Failed to add category');
    } finally {
      setCategoryModalLoading(false);
    }
  };

  // Handle Add Sub Category Modal
  const showAddSubCategoryModal = () => {
    setIsAddSubCategoryModalVisible(true);
    fetchCategories();
  };

  const handleAddSubCategoryCancel = () => {
    setIsAddSubCategoryModalVisible(false);
    subCategoryForm.resetFields();
  };

  const handleAddSubCategory = async (values: any) => {
    try {
      setSubCategoryModalLoading(true);
      
      const subCategoryData = {
        name: values.subCategoryName,
        description: values.description || '',
        categoryId: values.category
      };

      console.log('Submitting sub category data:', subCategoryData);
      
      const response = await subCategoryAPI.createSubCategory(subCategoryData);
      console.log('Sub category created successfully:', response);
      
      message.success('Sub category added successfully!');
      handleAddSubCategoryCancel();
      
    } catch (error) {
      console.error('Failed to create sub category:', error);
      message.error('Failed to add sub category');
    } finally {
      setSubCategoryModalLoading(false);
    }
  };

  // Handle Add Product Modal
  const showAddProductModal = () => {
    setIsAddProductModalVisible(true);
    fetchSubCategories();
  };

  const handleAddProductCancel = () => {
    setIsAddProductModalVisible(false);
    form.resetFields();
    setVariants([{ ram: '', price: 0, quantity: 1 }]);
    setUploadedImages([]);
  };

  // Handle variant changes
  const handleVariantChange = (index: number, field: keyof Variant, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  // Add new variant
  const addVariant = () => {
    setVariants([...variants, { ram: '', price: 0, quantity: 1 }]);
  };

  // Remove variant
  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      const newVariants = variants.filter((_, i) => i !== index);
      setVariants(newVariants);
    }
  };

  // Handle image upload
  const handleImageUpload = (file: File) => {
    // For now, we'll use a placeholder URL
    // In a real app, you'd upload to a server and get back a URL
    const imageUrl = URL.createObjectURL(file);
    setUploadedImages([...uploadedImages, imageUrl]);
    return false; // Prevent default upload behavior
  };

  // Handle form submission
  const handleAddProduct = async (values: any) => {
    try {
      setModalLoading(true);
      
      const productData = {
        name: values.title,
        description: values.description,
        subCategoryId: values.subCategory,
        variants: variants,
        images: uploadedImages
      };

      console.log('Submitting product data:', productData);
      
      const response = await productAPI.createProduct(productData);
      console.log('Product created successfully:', response);
      
      message.success('Product added successfully!');
      handleAddProductCancel();
      fetchProducts(); // Refresh the products list
      
    } catch (error) {
      console.error('Failed to create product:', error);
      message.error('Failed to add product');
    } finally {
      setModalLoading(false);
    }
  };

  // Watch for changes in selectedSubCategory and searchParams
  useEffect(() => {
    fetchProducts(1, pageSize);
  }, [selectedSubCategory, searchParams]);
  
  // Handle pagination change
  const handlePageChange = (page: number, size?: number) => {
    const newPageSize = size || pageSize;
    setPageSize(newPageSize);
    fetchProducts(page, newPageSize);
  };
  
  // Handle category selection from sidebar
  const handleCategorySelect = (category: string, categoryId?: string) => {
    console.log('Category selected in Home:', category, 'ID:', categoryId);
    setSelectedCategory(category);
    setSelectedCategoryId(categoryId || '');
    
    // Clear subcategory when "All categories" is selected
    if (category === 'All categories') {
      setSelectedSubCategory('');
    }
    
    // useEffect will handle the API call
  };
  
  // Handle subcategory selection from sidebar
  const handleSubCategorySelect = (subCategoryName: string, subCategoryId: string) => {
    console.log('Subcategory selected:', subCategoryName, 'ID:', subCategoryId);
    // Update state with the subcategory ID - useEffect will handle the API call
    setSelectedSubCategory(subCategoryId);
  };



  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-3">
          <Sidebar 
            onCategorySelect={handleCategorySelect}
            onSubCategorySelect={handleSubCategorySelect}
          />
        </div>
        <div className="col-md-9" style={{ padding: '20px' }}>
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item active">Home</li>
            </ol>
          </nav>

          {/* Admin Actions */}
          {user?.role === 'admin' && (
            <div style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                style={{ background: '#E6A623', border: 'none' }}
                onClick={showAddCategoryModal}
              >
                Add category
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                style={{ background: '#E6A623', border: 'none' }}
                onClick={showAddSubCategoryModal}
              >
                Add sub category
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                style={{ background: '#E6A623', border: 'none' }}
                onClick={showAddProductModal}
              >
                Add product
              </Button>
            </div>
          )}

          {/* Products Section */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <Title level={3}>
                {searchQuery ? `Search Results for "${searchQuery}"` : 'Featured Products'}
              </Title>
              <Text type="secondary">
                {searchQuery 
                  ? `Found ${products.length} products matching your search`
                  : 'Discover our latest collection of amazing products'
                }
              </Text>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
              <Spin size="large" />
            </div>
          ) : products.length > 0 ? (
            <div className="row">
              {products.map((product: Product) => (
                <div key={product._id} className="col-lg-4 col-md-6 mb-4">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Empty description="No products found" />
            </div>
          )}

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px' }}>
            <span>{products.length} of {totalProducts} items</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span>Show:</span>
              <Select 
                value={pageSize.toString()} 
                onChange={(value) => handlePageChange(1, parseInt(value))}
                style={{ width: 80 }}
              >
                <Select.Option value="10">10</Select.Option>
                <Select.Option value="20">20</Select.Option>
                <Select.Option value="50">50</Select.Option>
              </Select>
              <span>rows</span>
            </div>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Pagination
              current={currentPage}
              total={totalProducts}
              pageSize={pageSize}
              showSizeChanger={false}
              onChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      <Modal
        title="Add Category"
        open={isAddCategoryModalVisible}
        onCancel={handleAddCategoryCancel}
        footer={null}
        width={400}
        confirmLoading={categoryModalLoading}
      >
        <Form
          form={categoryForm}
          layout="vertical"
          onFinish={handleAddCategory}
        >
          <Form.Item
            label="Enter category name :"
            name="categoryName"
            rules={[{ required: true, message: 'Please enter category name' }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>

          <Form.Item
            label="Description :"
            name="description"
          >
            <TextArea
              rows={3}
              placeholder="Enter category description (optional)"
            />
          </Form.Item>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <Button onClick={handleAddCategoryCancel}>
              DISCARD
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={categoryModalLoading}
              style={{ background: '#E6A623', border: 'none' }}
            >
              ADD
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Add Sub Category Modal */}
      <Modal
        title="Add Sub Category"
        open={isAddSubCategoryModalVisible}
        onCancel={handleAddSubCategoryCancel}
        footer={null}
        width={400}
        confirmLoading={subCategoryModalLoading}
      >
        <Form
          form={subCategoryForm}
          layout="vertical"
          onFinish={handleAddSubCategory}
        >
          <Form.Item
            label="Select category :"
            name="category"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select placeholder="Select category">
              {categories.map((category) => (
                <Select.Option key={category._id} value={category._id}>
                  {category.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Enter sub category name :"
            name="subCategoryName"
            rules={[{ required: true, message: 'Please enter sub category name' }]}
          >
            <Input placeholder="Enter sub category name" />
          </Form.Item>

          <Form.Item
            label="Description :"
            name="description"
          >
            <TextArea
              rows={3}
              placeholder="Enter sub category description (optional)"
            />
          </Form.Item>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <Button onClick={handleAddSubCategoryCancel}>
              DISCARD
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={subCategoryModalLoading}
              style={{ background: '#E6A623', border: 'none' }}
            >
              ADD
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Add Product Modal */}
      <Modal
        title="Add Product"
        open={isAddProductModalVisible}
        onCancel={handleAddProductCancel}
        footer={null}
        width={600}
        confirmLoading={modalLoading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddProduct}
        >
          {/* Title */}
          <Form.Item
            label="Title :"
            name="title"
            rules={[{ required: true, message: 'Please enter product title' }]}
          >
            <Input placeholder="Enter product title" />
          </Form.Item>

          {/* Variants */}
          <Form.Item label="Variants :">
            {variants.map((variant, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <Input
                  placeholder="Ram"
                  value={variant.ram}
                  onChange={(e) => handleVariantChange(index, 'ram', e.target.value)}
                  style={{ width: '100px' }}
                />
                <Input
                  placeholder="Price"
                  prefix="$ "
                  value={variant.price}
                  onChange={(e) => handleVariantChange(index, 'price', parseFloat(e.target.value) || 0)}
                  style={{ width: '120px' }}
                />
                <Input
                  placeholder="QTY"
                  value={variant.quantity}
                  onChange={(e) => handleVariantChange(index, 'quantity', parseInt(e.target.value) || 0)}
                  style={{ width: '80px' }}
                />
                {variants.length > 1 && (
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={() => removeVariant(index)}
                    danger
                  />
                )}
              </div>
            ))}
            <Button
              type="dashed"
              onClick={addVariant}
              style={{ width: '100%', marginTop: '8px' }}
            >
              Add variants
            </Button>
          </Form.Item>

          {/* Sub Category */}
          <Form.Item
            label="Sub category :"
            name="subCategory"
            rules={[{ required: true, message: 'Please select sub category' }]}
          >
            <Select placeholder="Select sub category">
              {subCategories.map((subCategory) => (
                <Select.Option key={subCategory._id} value={subCategory._id}>
                  {subCategory.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* Description */}
          <Form.Item
            label="Description :"
            name="description"
            rules={[{ required: true, message: 'Please enter product description' }]}
          >
            <TextArea
              rows={4}
              placeholder="Enter product description"
            />
          </Form.Item>

          {/* Upload Images */}
          <Form.Item label="Upload image :">
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {/* Existing uploaded images */}
              {uploadedImages.map((image, index) => (
                <div key={index} style={{ position: 'relative' }}>
                  <img
                    src={image}
                    alt={`Product ${index + 1}`}
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    size="small"
                    style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'white' }}
                    onClick={() => setUploadedImages(uploadedImages.filter((_, i) => i !== index))}
                  />
                </div>
              ))}
              
              {/* Upload button */}
              <Upload
                beforeUpload={handleImageUpload}
                showUploadList={false}
                accept="image/*"
              >
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    border: '2px dashed #d9d9d9',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <CameraOutlined style={{ fontSize: '20px', color: '#999' }} />
                  <PlusOutlined style={{ fontSize: '16px', color: '#999' }} />
                </div>
              </Upload>
            </div>
          </Form.Item>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <Button onClick={handleAddProductCancel}>
              DISCARD
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={modalLoading}
              style={{ background: '#E6A623', border: 'none' }}
            >
              ADD
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Home;