import PostForm from '../PostForm';
import { createPostAction } from '../actions';

export const dynamic = 'force-dynamic';

export default function NewPostPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-slate-900">Add post</h1>
      <div className="mt-6">
        <PostForm action={createPostAction} submitLabel="Add post" />
      </div>
    </div>
  );
}
