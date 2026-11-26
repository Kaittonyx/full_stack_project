import { Plus } from "lucide-react";
import ListFilters from "@/components/ListFilters";
import ModalButton from "@/components/ModalButton";
import PromoCreateForm from "@/components/PromoCreateForm";
import { deletePromoAction, togglePromoAction } from "@/lib/promo-actions";
import { describePromo, promoStatus, type Promo } from "@/lib/promos";

const fmtDate = (key: string) => key.split("-").reverse().join(".");

export default function PromoManager({ promos }: { promos: Promo[] }) {
    return (
        <>
            <div className="section-head">
                <h2>Промокоды</h2>
                <ModalButton
                    label={
                        <>
                            <Plus size={16} />
                            Новый промокод
                        </>
                    }
                    title="Новый промокод"
                    className="btn btn-primary btn-sm"
                    resetKey={String(promos.length)}
                >
                    <PromoCreateForm />
                </ModalButton>
            </div>

            <ListFilters
                options={[
                    { value: "active", label: "Активные" },
                    { value: "inactive", label: "Неактивные" },
                ]}
                searchPlaceholder="Поиск промокодов"
            >
                <div className="table-wrap">
                    <table>
                        <thead>
                        <tr>
                            <th>Код</th>
                            <th>Условие</th>
                            <th>Использован</th>
                            <th>Статус</th>
                            <th />
                        </tr>
                        </thead>
                        <tbody>
                        {promos.length === 0 && (
                            <tr>
                                <td colSpan={5} className="muted">
                                    Промокодов пока нет
                                </td>
                            </tr>
                        )}
                        {promos.map((p) => {
                            const status = promoStatus(p);
                            return (
                                <tr
                                    key={p.code}
                                    data-filter-item
                                    data-filter={status.active ? "active" : "inactive"}
                                    data-search={`${p.code} ${describePromo(p)}`}
                                >
                                    <td>
                                        <strong>{p.code}</strong>
                                    </td>
                                    <td className="small">
                                        {describePromo(p)}
                                        {p.expiresAt && <div className="muted">до {fmtDate(p.expiresAt)}</div>}
                                    </td>
                                    <td className="small">
                                        {p.used}
                                        {p.usageLimit > 0 ? ` / ${p.usageLimit}` : ""}
                                    </td>
                                    <td>
                                        <span className={`badge badge-${status.tone}`}>{status.label}</span>
                                    </td>
                                    <td className="right">
                                        <div className="row" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
                                            <form action={togglePromoAction}>
                                                <input type="hidden" name="code" value={p.code} />
                                                <input type="hidden" name="active" value={p.isActive ? "off" : "on"} />
                                                <button type="submit" className="btn btn-ghost btn-sm">
                                                    {p.isActive ? "Отключить" : "Включить"}
                                                </button>
                                            </form>
                                            <ModalButton label="Удалить" title="Удалить промокод?" resetKey={p.code}>
                                                <p>Промокод «{p.code}» исчезнет из списка. Клиенты больше не смогут его применить.</p>
                                                <form action={deletePromoAction} className="dialog-form" style={{ marginTop: 16 }}>
                                                    <input type="hidden" name="code" value={p.code} />
                                                    <button type="submit" className="btn btn-primary">
                                                        Да, удалить
                                                    </button>
                                                </form>
                                            </ModalButton>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </ListFilters>
        </>
    );
}