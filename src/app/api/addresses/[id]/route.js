import { handleApi, jsonOk, readJson } from '@/lib/http';
import { deleteAddress, setDefaultAddress, updateAddress } from '@/lib/accountOps';
import { requireUser } from '@/lib/session';

export const PATCH = handleApi(async (request, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  const body = await readJson(request);
  if (body.action === 'default' || (body.isDefault === true && Object.keys(body).length <= 2)) {
    return jsonOk(await setDefaultAddress(user, id));
  }
  return jsonOk(await updateAddress(user, id, body));
});

export const DELETE = handleApi(async (_request, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  return jsonOk(await deleteAddress(user, id));
});
