'use client';
import ProductForm from '../ProductForm';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const { id } = params;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-800">ویرایش محصول</h1>
      <ProductForm productId={Number(id)} />
    </div>
  );
}
