import { notFound, redirect } from 'next/navigation';
import { PostgresPostRepository } from '@/infrastructure/repositories/PostgresPostRepository';
import { getTenantId } from '@/lib/tenantContext';
import { getSessionUser } from '@/lib/session';
import { canEditContent } from '@/lib/rbac';
import PostForm from '../../PostForm';
import { updatePostAction } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const tenantId = getTenantId();
  const [user, post] = await Promise.all([
    getSessionUser(),
    new PostgresPostRepository().findById(tenantId, params.id),
  ]);

  if (!post) {
    notFound();
  }
  if (!canEditContent(user, post)) {
    redirect('/admin/posts');
  }

  const boundAction = updatePostAction.bind(null, post.id);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-slate-100">Edit post</h1>
      <div className="mt-6">
        <PostForm action={boundAction} post={post} submitLabel="Save changes" />
      </div>
    </div>
  );
}
