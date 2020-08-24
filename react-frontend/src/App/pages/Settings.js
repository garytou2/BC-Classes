import React, { Component } from "react";
import { Layout, Spin } from "antd";
import "./Settings.css";
import ProfilePicture from "../../components/ProfilePicture";
import Firebase from "../../utils/Firebase";

class Settings extends Component {
	constructor() {
		super();
		this.state = {
			loggedIn: "",
		};
	}

	componentDidMount() {
		//TODO: need to remove listener on dismount
		Firebase.auth().onAuthStateChanged((user) => {
			if (user) {
				var lastSignInTime = Date(user.metadata.lastSignInTime);
				this.setState({ lastSignInTime: lastSignInTime });
				var uid = user.uid;
				Firebase.database()
					.ref("/users/" + uid)
					.once(
						"value",
						function (snapshot) {
							this.setState({
								name: snapshot.val().name,
								notifEmail: snapshot.val().email,
							});
						}.bind(this)
					);
				this.setState({ loggedIn: true });
			} else {
				this.setState({ loggedIn: false });
			}
		});
	}

	render() {
		return (
			<Layout.Content className="settings-content">
				<div className="page-contents">
					<div className="page-titleContainer">
						<h1 className="page-title1">Settings</h1>
					</div>
					{this.state.loggedIn === true ? (
						<>
							<div className="settings-section">
								<h1>Registrations</h1>
							</div>
							<div className="settings-section profile">
								<div className="profile-flexItem profile-profilePicture">
									<ProfilePicture size={200} />
								</div>
								<div className="profile-flexItem profile-info">
									<h1 className="profile-infoName">{this.state.name}</h1>
									<p className="profile-infoOther">
										{/* TODO: Allow for editing of notif email */}
										<strong>Notification Email:</strong> {this.state.notifEmail}
									</p>
									<p className="profile-infoOther">
										<strong>Recent Login:</strong> {this.state.lastSignInTime}
									</p>
								</div>
							</div>
						</>
					) : this.state.loggedIn === false ? (
						<div className="settings-section">
							<p>You must be logged in.</p>
						</div>
					) : (
						<Spin />
					)}
				</div>
			</Layout.Content>
		);
	}
}
export default Settings;
