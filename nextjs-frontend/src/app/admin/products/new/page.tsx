import ProductForm from '../ProductForm';

export const metadata = { title: 'محصول جدید' };

export default function NewProductPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-800">محصول جدید</h1>
      <ProductForm />
    </div>
  );
}
