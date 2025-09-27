import { fetchCategories, fetchProductsByCatId, fetchSubcategories } from '@/renderer/utils/menu'
import { Category, SubCategory } from '@/types/categories'
import React, { useEffect, useState } from 'react'
import CustomButton from '../ui/CustomButton'
import { Product } from '@/types/Menu'
import OrderTakingForm from './OrderTakingForm'

const OrderMenu = ({ token }: { token: string | null }) => {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [subCategories, setSubCategories] = useState<SubCategory[] | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  useEffect(() => {
    fetchCategories(token, setCategories);
  }, [])
  const handleSelectCategory = (category: Category) => {
    fetchSubcategories(category.id, token, setSubCategories);
  }
  const handleSelectSubCategory = (subcat: SubCategory) => {
    fetchProductsByCatId(token, subcat.id, setProducts);
  }
  return (
    <>
    {selectedProduct && <OrderTakingForm token={token} product={selectedProduct} setProduct={setSelectedProduct}/>}
    <div className='p-4'>
      <div className='grid grid-cols-7 items-center gap-4 mb-4 flex-wrap'>{categories && categories.map(category => {
        return <CustomButton key={category.id} type='button' label={category.categoryName} onClick={() => handleSelectCategory(category)} className={`bg-${category.color}-500 hover:bg-${category.color}-600 border-${category.color}-900`} />
      })
      }
      </div>
      <div className='grid grid-cols-7 items-center gap-4 mb-4 flex-wrap'>{
        subCategories && subCategories.map(subcat => {
          return <CustomButton key={subcat.id} type='button' label={subcat.name} className={`bg-${subcat.color}-500 hover:bg-${subcat.color}-600 border-${subcat.color}-900`} onClick={() => handleSelectSubCategory(subcat)} />
        })
      }
      </div>
      <div className='grid grid-cols-7 items-center gap-4 mb-4 flex-wrap'>{
        products && products.map(p => {
          return <button onClick={() => setSelectedProduct(p)} key={p.id} type='button' className='px-4 py-2 bg-gray-200 hover:bg-gray-300 border border-indigo-400 flex gap-4 flex-col justify-center focus:ring-2 focus:ring-indigo-300 transition-colors duration-300 rounded-md text-gray-800 cursor-pointer'>
            <span>{p.name}</span>
            <span>{p.price}</span>
          </button>
        })
      }
      </div>
    </div>
    </>
  )
}

export default OrderMenu