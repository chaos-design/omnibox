import { Loading } from '../components/loading';

import s from './loading.module.scss';

export default function RouteLoading() {
  return <Loading className={s.root} />;
}
