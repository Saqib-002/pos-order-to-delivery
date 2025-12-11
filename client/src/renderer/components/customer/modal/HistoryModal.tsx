import { Customer } from '@/types/order'
interface HistoryModalProps{
    customer: Customer;
    onClose: () => void
}
const HistoryModal = ({customer,onClose}:HistoryModalProps) => {
  return (
    <div>HistoryModal</div>
  )
}

export default HistoryModal