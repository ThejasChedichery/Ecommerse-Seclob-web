import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, InputNumber, Radio, Tag, Spin, message } from 'antd';
import { HeartOutlined, HeartFilled, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { productAPI, wishlistAPI } from '../utils/api';

interface Product {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  subCategoryId?: string;
  variants?: Array<{ ram: string; price: number; quantity: number }>;
  images?: string[];
  image?: string; // Fallback for single image
  price?: number;
  category: string;
  subCategory: string;
  availability: string;
  stock: number;
  rating: number;
  specs: {
    ram: string[];
  };
}

const ProductDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRam, setSelectedRam] = useState('4 GB');
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Check if product is in wishlist on component mount
  useEffect(() => {
    if (user?.id && product?._id) {
      checkWishlistStatus();
    } else {
      setIsInWishlist(false);
    }
  }, [user?.id, product?._id]);

  const checkWishlistStatus = async () => {
    if (!user?.id || !product?._id) return;
    
    try {
      const response = await wishlistAPI.getWishlistByUser(user.id);
      const wishlistData = response.data || response.wishlist || response;
      
      // Check if product is in wishlist based on the actual API structure
      const isInWishlist = wishlistData.some((item: any) => {
        // Handle both possible structures: productId (object) or productId (string)
        if (item.productId && typeof item.productId === 'object') {
          return item.productId._id === product._id;
        } else if (item.productId && typeof item.productId === 'string') {
          return item.productId === product._id;
        } else if (item.product && item.product._id) {
          return item.product._id === product._id;
        }
        return false;
      });
      
      setIsInWishlist(isInWishlist);
    } catch (error) {
      console.error('Failed to check wishlist status:', error);
    }
  };

  const handleWishlistToggle = async () => {
    if (!user?.id || !product?._id) {
      message.error('Please login to manage wishlist');
      return;
    }

    setWishlistLoading(true);
    
    try {
      if (isInWishlist) {
        // Remove from wishlist
        await wishlistAPI.removeFromWishlist(user.id, product._id);
        setIsInWishlist(false);
        message.success('Removed from wishlist');
      } else {
        // Add to wishlist
        await wishlistAPI.addToWishlist({
          userId: user.id,
          productId: product._id
        });
        setIsInWishlist(true);
        message.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Wishlist operation failed:', error);
      message.error('Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError('No product ID provided');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching product with ID:', id);
        
        const response = await productAPI.getProductById(id);
        console.log('Raw API response:', response);
        
        // Check if response exists and has data
        if (!response) {
          throw new Error('No response from API');
        }
        
        // Handle different possible response structures
        let productData;
        if (response.data) {
          productData = response.data;
        } else if (response.product) {
          productData = response.product;
        } else {
          productData = response;
        }
        
        console.log('Processed product data:', productData);
        
        // Validate that we have the required fields
        if (!productData || (!productData.id && !productData._id) || !productData.name) {
          throw new Error('Invalid product data received - missing ID or name');
        }
        
        // Ensure we have default values for optional fields
        const processedProduct: Product = {
          _id: productData._id,
          id: productData.id || productData._id, // Use _id as fallback for id
          name: productData.name,
          description: productData.description,
          subCategoryId: productData.subCategoryId,
          variants: productData.variants,
          images: productData.images,
          image: productData.image,
          price: productData.price || (productData.variants?.[0]?.price || 0),
          category: productData.category || 'Unknown',
          subCategory: productData.subCategory || 'Unknown',
          availability: productData.availability || 'Unknown',
          stock: productData.stock || (productData.variants?.[0]?.quantity || 0),
          rating: productData.rating || 0,
          specs: {
            ram: productData.specs?.ram || productData.variants?.map((v: { ram: string }) => v.ram) || ['4 GB', '8 GB', '16 GB']
          }
        };
        
        console.log('Final processed product:', processedProduct);
        setProduct(processedProduct);
        
      } catch (error) {
        console.error('Error fetching product:', error);
        setError(error instanceof Error ? error.message : 'Failed to load product details');
        message.error('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    // TODO: Implement add to cart functionality
    message.success('Product added to cart!');
  };

  const handleBuyNow = () => {
    if (!product) return;
    // TODO: Implement buy now functionality
    message.success('Proceeding to checkout!');
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '20px 0', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading product details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ padding: '20px 0', textAlign: 'center' }}>
        <div style={{ color: 'red', marginBottom: '16px' }}>Error: {error}</div>
        <div style={{ marginBottom: '16px' }}>Product ID: {id}</div>
        <Button type="primary" onClick={() => navigate('/')} style={{ marginRight: '8px' }}>
          Back to Home
        </Button>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '20px 0', textAlign: 'center' }}>
        <div>Product not found</div>
        <div style={{ marginBottom: '16px' }}>Product ID: {id}</div>
        <Button type="primary" onClick={() => navigate('/')} style={{ marginTop: '16px' }}>
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '20px 0' }}>
    

      {/* Breadcrumb */}
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a>
          </li>
          <li className="breadcrumb-item active">Product details</li>
        </ol>
      </nav>

      <div className="row">
        {/* Product Images */}
        <div className="col-md-6">
          <div style={{ border: '1px solid #f0f0f0', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <img 
              src={(() => {
                // Check if images array exists and has valid URLs
                if (product.images && product.images.length > 0) {
                  const firstImage = product.images[0];
                  if (firstImage && 
                      !firstImage.includes('example.com') && 
                      !firstImage.includes('placeholder') &&
                      !firstImage.startsWith('blob:')) {
                    return firstImage;
                  }
                }
                
                // Check if single image field exists and is valid
                if (product.image && 
                    !product.image.includes('example.com') && 
                    !product.image.includes('placeholder') &&
                    !product.image.startsWith('blob:')) {
                  return product.image;
                }
                
                // Return a working placeholder image
                return 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=400';
              })()} 
              alt={product.name}
              style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: '8px' }}
              onError={(e) => {
                console.log('Image failed to load, using fallback');
                e.currentTarget.src = 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=400';
              }}
            />
          </div>
          
          {/* Thumbnail Images */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {(() => {
              // Filter out invalid image URLs
              const validImages = product.images?.filter(img => 
                img && 
                !img.includes('example.com') && 
                !img.includes('placeholder') &&
                !img.startsWith('blob:')
              ) || [];
              
              if (validImages.length > 0) {
                return validImages.slice(0, 2).map((image, index) => (
                  <div key={index} style={{ border: '1px solid #f0f0f0', borderRadius: '8px', padding: '12px', width: '120px', height: '120px' }}>
                    <img 
                      src={image} 
                      alt={`${product.name} - Image ${index + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=120';
                      }}
                    />
                  </div>
                ));
              } else {
                // Show placeholder thumbnails
                return (
                  <>
                    <div style={{ border: '1px solid #f0f0f0', borderRadius: '8px', padding: '12px', width: '120px', height: '120px' }}>
                      <img 
                        src="https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=120" 
                        alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    </div>
                    <div style={{ border: '1px solid #f0f0f0', borderRadius: '8px', padding: '12px', width: '120px', height: '120px' }}>
                      <img 
                        src="https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=120" 
                        alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    </div>
                  </>
                );
              }
            })()}
          </div>
        </div>

        {/* Product Details */}
        <div className="col-md-6">
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '16px' }}>
            {product.name}
          </h1>
          
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1E5D8C', marginBottom: '16px' }}>
            ${product.price}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontWeight: '500', marginRight: '8px' }}>Availability:</span>
            <Tag color="green">{product.availability}</Tag>
          </div>

          <div style={{ color: '#E6A623', marginBottom: '24px' }}>
            Hurry up! only {product.stock} product left in stock!
          </div>

          {/* RAM Selection */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontWeight: '500', marginBottom: '12px' }}>Ram:</div>
            <Radio.Group 
              value={selectedRam} 
              onChange={(e) => setSelectedRam(e.target.value)}
              buttonStyle="solid"
            >
              {product.specs.ram.map(ram => (
                <Radio.Button key={ram} value={ram} style={{ marginRight: '8px' }}>
                  {ram}
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>

          {/* Quantity */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontWeight: '500', marginBottom: '12px' }}>Quantity:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="quantity-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                <MinusOutlined />
              </div>
              <InputNumber
                min={1}
                max={product.stock}
                value={quantity}
                onChange={(value) => setQuantity(value || 1)}
                style={{ width: '80px' }}
              />
              <div className="quantity-btn" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>
                <PlusOutlined />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Button 
              type="primary"
              size="large"
              style={{ background: '#E6A623', border: 'none', borderRadius: '25px', paddingLeft: '32px', paddingRight: '32px' }}
              onClick={handleAddToCart}
            >
              Add to Cart
            </Button>
            <Button 
              type="primary"
              size="large"
              style={{ background: '#E6A623', border: 'none', borderRadius: '25px', paddingLeft: '32px', paddingRight: '32px' }}
              onClick={handleBuyNow}
            >
              Buy it now
            </Button>
            <Button 
              type="text"
              size="large"
              icon={isInWishlist ? <HeartFilled /> : <HeartOutlined />}
              loading={wishlistLoading}
              style={{ 
                border: '1px solid #d9d9d9', 
                borderRadius: '8px',
                color: isInWishlist ? '#ff4d4f' : '#666'
              }}
              onClick={handleWishlistToggle}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;