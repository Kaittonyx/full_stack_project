import ModalButton from "@/components/ModalButton";

export default function DeleteProductModal({
                                               id,
                                               name,
                                               action,
                                           }: {
    id: string;
    name: string;
    action: (formData: FormData) => Promise<void>;
}) {
    return (
        <ModalButton label="Удалить" title="Удалить блюдо?" resetKey={id}>
            <p>Блюдо «{name}» исчезнет из меню и каталога. Это действие нельзя отменить.</p>
            <form action={action} className="dialog-form" style={{ marginTop: 16 }}>
                <input type="hidden" name="id" value={id} />
                <button type="submit" className="btn btn-primary">
                    Да, удалить
                </button>
            </form>
        </ModalButton>
    );
}