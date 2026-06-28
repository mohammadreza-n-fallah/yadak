import PostForm from '../PostForm';

export const metadata = { title: 'پست جدید' };

export default function NewPostPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-800">پست جدید</h1>
      <PostForm />
    </div>
  );
}
