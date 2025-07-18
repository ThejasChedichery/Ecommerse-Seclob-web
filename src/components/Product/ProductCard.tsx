import React, { useState, useEffect } from 'react';
import { Card, Button, Rate } from 'antd';
import { EyeOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { wishlistAPI } from '../../utils/api';
import { message } from 'antd';

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
  category?: string;
  subCategory?: string;
  availability?: string;
  stock?: number;
  rating?: number;
  specs?: {
    ram: string[];
  };
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Check if product is in wishlist on component mount
  useEffect(() => {
    if (user?.id && product._id) {
      checkWishlistStatus();
    } else {
      setIsInWishlist(false);
    }
  }, [user?.id, product._id]);

  const checkWishlistStatus = async () => {
    if (!user?.id || !product._id) return;
    
    try {
      const response = await wishlistAPI.getWishlistByUser(user.id);
      const wishlistData = response.data || response.wishlist || response;
      const productIds = wishlistData.map((item: any) => item.productId || item.product?._id);
      setIsInWishlist(productIds.includes(product._id));
    } catch (error) {
      console.error('Failed to check wishlist status:', error);
    }
  };

  const handleViewProduct = () => {
    // Get the product ID, handling both _id and id fields
    const productId = product._id || product.id;
    
    console.log('ProductCard - Product data:', product);
    console.log('ProductCard - Product ID:', productId);
    
    if (!productId) {
      console.error('ProductCard - No product ID found:', product);
      return;
    }
    
    navigate(`/product/${productId}`);
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (!user?.id || !product._id) {
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

  // Get the product ID for display
  const productId = product._id || product.id;
  
  // Handle image - try images array first, then single image, then fallback
  const getProductImage = () => {
    // Check if images array exists and has valid URLs
    if (product.images && product.images.length > 0) {
      const firstImage = product.images[0];
      // Check if it's a valid image URL (not a placeholder or blob)
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
  };

  // Get price from variants or direct price field
  const getProductPrice = () => {
    if (product.variants && product.variants.length > 0) {
      return product.variants[0].price; // Use first variant price
    }
    return product.price || 0;
  };

  const productImage = getProductImage();
  const productPrice = getProductPrice();
  const productRating = product.rating || 0;

  return (
    <Card
      className="product-card h-100"
      cover={
        <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
          <img 
            alt={product.name} 
            src={productImage}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              console.log('Image failed to load:', productImage);
              e.currentTarget.src = 'https://via.placeholder.com/400x200?text=No+Image';
            }}
          />
          {/* View Button */}
          <Button
            type="text"
            icon={<EyeOutlined />}
            style={{ 
              position: 'absolute', 
              top: '10px', 
              right: '10px',
              background: 'rgba(255,255,255,0.8)',
              borderRadius: '50%'
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleViewProduct();
            }}
          />
          {/* Wishlist Button */}
          <Button
            type="text"
            icon={isInWishlist ? <HeartFilled /> : <HeartOutlined />}
            loading={wishlistLoading}
            style={{ 
              position: 'absolute', 
              top: '10px', 
              right: '50px',
              background: 'rgba(255,255,255,0.8)',
              borderRadius: '50%',
              color: isInWishlist ? '#ff4d4f' : '#666'
            }}
            onClick={handleWishlistToggle}
          />
        </div>
      }
      style={{ cursor: 'pointer' }}
      onClick={handleViewProduct}
    >
      <Card.Meta
        title={product.name}
        description={
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1E5D8C', marginBottom: '8px' }}>
              ${productPrice}
            </div>
            <Rate disabled defaultValue={productRating} style={{ fontSize: '14px' }} />
            {/* Debug info - remove in production */}
            <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
              ID: {productId || 'undefined'} | Images: {product.images?.length || 0} | Wishlist: {isInWishlist ? 'Yes' : 'No'}
            </div>
          </div>
        }
      />
    </Card>
  );
};

export default ProductCard;