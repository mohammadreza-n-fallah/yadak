'use client';
import PostForm from '../PostForm';

export default function EditPostPage({ params }: { params: { id: string } }) {
  const { id } = params;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-800">ویرایش پست</h1>
      <PostForm postId={Number(id)} />
    </div>
  );
}
